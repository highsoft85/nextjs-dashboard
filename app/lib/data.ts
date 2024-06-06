import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue, Invoice, FormattedCustomersTable,
} from './definitions';
import { formatCurrency, flatten } from './utils';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from './prisma';

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    const data = await prisma.revenue.findMany();

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();

  try {
    const data = await prisma.invoices.findMany({
      relationLoadStrategy: 'join',
      select: {
        id: true,
        amount: true,
        customer: {
          select: {
            name: true,
            image_url: true,
            email: true,
          },
        },
      },
      take: 5,
    });

    const latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      name: invoice.customer.name,
      image_url: invoice.customer.image_url,
      email: invoice.customer.email,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (e) {
    console.error('Database Error:', e);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();

  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = prisma.invoices.count();
    const customerCountPromise = prisma.customers.aggregate({
      _count: true,
    });
    const invoiceStatusPromise: object = prisma.invoices.groupBy({
      _sum: {
        amount: true,
      },
      by: ['status'],
    })

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0] ?? '0');
    const numberOfCustomers = Number(data[1]._count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].find(item => item.status == "paid")?._sum.amount ?? 0);
    const totalPendingInvoices = formatCurrency(data[2].find(item => item.status == "pending")?._sum.amount ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await prisma.invoices.findMany({
      relationLoadStrategy: 'join',
      include: {
        customer: {
          select: {
            name: true,
            image_url: true,
            email: true,
          },
        },
      },
      where: {
        OR: [
          {status: {contains: query, mode: 'insensitive'}},
          {customer: {name: {contains: query, mode: 'insensitive'}}},
          {customer: {email: {contains: query, mode: 'insensitive'}}},
        ],
      },
      orderBy: {date: 'desc'},
      skip: offset,
      take: ITEMS_PER_PAGE,
    });

    const invoices = data.map((invoice) =>
      flatten(invoice) as InvoicesTable
    );

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();

  try {
    const data = await prisma.invoices.aggregate({
      _count: true,
      where: {
        OR: [
          {status: {contains: query, mode: 'insensitive'}},
          {customer: {name: {contains: query, mode: 'insensitive'}}},
          {customer: {email: {contains: query, mode: 'insensitive'}}},
        ],
      },
    });

    const totalPages = Math.ceil(Number(data._count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();

  try {
    const data = await prisma.invoices.findFirst({
      where: {id: `${id}`}
    });
    const invoice = data as InvoiceForm;
    invoice.amount = invoice.amount / 100;

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore();

  try {
    const data: CustomerField[] = await prisma.customers.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();

  try {
    const data: Array<FormattedCustomersTable> = await prisma.$queryRaw`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
          customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
      `;

    const customers = data.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      image_url: customer.image_url,
      total_invoices: Number(customer.total_invoices),
      total_pending: formatCurrency(Number(customer.total_pending)),
      total_paid: formatCurrency(Number(customer.total_paid)),
    } as FormattedCustomersTable));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await prisma.users.findFirst({
      where: {email: `${email}`}
    });

    return user as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
