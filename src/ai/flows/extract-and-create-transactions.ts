
'use server';
/**
 * @fileOverview A flow for extracting transaction data from a document and creating corresponding records in Firestore.
 *
 * - extractAndCreateTransactions - A function that handles the transaction extraction and creation process.
 * - ExtractAndCreateTransactionsInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Transaction, Customer } from '@/lib/types';
import { format, parse } from 'date-fns';

const TransactionFromDocSchema = z.object({
  customerName: z.string().describe("The name of the debtor or customer."),
  invoiceNumber: z.string().describe("The unique invoice number."),
  dateOfSupply: z.string().describe("The date the supply was made, in 'd MMMM, yyyy' format (e.g., '24th April, 2025')."),
  amount: z.number().describe("The total amount of the invoice."),
  remarks: z.string().optional().describe("Any remarks or notes about the transaction."),
});

const ExtractAndCreateTransactionsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A document containing a list of transactions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  companyId: z.string().describe('The ID of the company to associate the transactions with.'),
});
export type ExtractAndCreateTransactionsInput = z.infer<typeof ExtractAndCreateTransactionsInputSchema>;

const ExtractAndCreateTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionFromDocSchema),
});

export async function extractAndCreateTransactions(input: ExtractAndCreateTransactionsInput): Promise<{ count: number }> {
  return extractAndCreateTransactionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionsFromDocPrompt',
  input: { schema: z.object({ fileDataUri: z.string() }) },
  output: { schema: ExtractAndCreateTransactionsOutputSchema },
  prompt: `You are an expert at analyzing financial documents like debt trackers or ledgers.
Analyze the following document and extract a list of all transactions mentioned.
For each transaction, identify the debtor's name, invoice number, date of supply, amount, and any remarks.
The 'NAME OF DEPTOR' is the customer name. 'INVOICE NO' is the invoice number. 'DATE OF SUPPLY' is the date.
Return the data as a list of transaction objects.

Document: {{media url=fileDataUri}}`,
});

const extractAndCreateTransactionsFlow = ai.defineFlow(
  {
    name: 'extractAndCreateTransactionsFlow',
    inputSchema: ExtractAndCreateTransactionsInputSchema,
    outputSchema: z.object({ count: z.number() }),
  },
  async ({ fileDataUri, companyId }) => {
    // Step 1: Extract transactions from the document using the LLM
    const { output } = await prompt({ fileDataUri });

    if (!output || !output.transactions || output.transactions.length === 0) {
      return { count: 0 };
    }

    const batch = db.batch();
    const transactionsCollection = db.collection('transactions');
    const customersCollection = db.collection('customers');
    let transactionCount = 0;

    for (const trans of output.transactions) {
      // Find or create customer
      const customerQuery = await customersCollection
        .where('name', '==', trans.customerName)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();

      let customerId: string;
      if (customerQuery.empty) {
        // Create new customer if not found
        const newCustomerRef = customersCollection.doc();
        const newCustomer: Omit<Customer, 'id'> = {
          name: trans.customerName,
          companyId,
          // Add placeholder details, as they are not in the document
          contactPerson: 'N/A',
          contactEmail: 'N/A',
          phone: 'N/A',
          address: 'N/A',
        };
        batch.set(newCustomerRef, { ...newCustomer, id: newCustomerRef.id });
        customerId = newCustomerRef.id;
      } else {
        customerId = customerQuery.docs[0].id;
      }

      // Determine payment status from remarks
      let paymentStatus: Transaction['paymentStatus'] = 'Pending';
      let amountPaid = 0;
      if (trans.remarks) {
          if (trans.remarks.toLowerCase().includes('paid')) {
              paymentStatus = 'Fully Paid';
              amountPaid = trans.amount;
          } else if (trans.remarks.toLowerCase().includes('cash ready') || trans.remarks.toLowerCase().includes('cheque is ready')) {
              paymentStatus = 'Pending';
          }
      }

      // Parse date string
      let supplyDate: Date;
      try {
          // Attempt to parse '24th April, 2025' format
          const cleanDateString = trans.dateOfSupply.replace(/(st|nd|rd|th)/, '');
          supplyDate = parse(cleanDateString, 'd MMMM, yyyy', new Date());
          if (isNaN(supplyDate.getTime())) {
             supplyDate = new Date(); // Fallback
          }
      } catch (e) {
          supplyDate = new Date(); // Fallback on parsing error
      }
      

      const transactionRef = transactionsCollection.doc();
      const newTransaction: Omit<Transaction, 'id'> = {
        transactionId: trans.invoiceNumber,
        customerName: trans.customerName,
        customerId,
        date: format(supplyDate, 'yyyy-MM-dd'),
        total: trans.amount,
        amountPaid: amountPaid, // Assume 0 paid unless specified in remarks
        paymentStatus: paymentStatus,
        products: [{
            id: 'imported-service',
            name: 'Imported Service/Product',
            quantity: 1,
            unitPrice: trans.amount
        }], // Generic product line item
        companyId,
      };

      batch.set(transactionRef, { ...newTransaction, id: transactionRef.id });
      transactionCount++;
    }

    await batch.commit();

    return {
      count: transactionCount,
    };
  }
);
