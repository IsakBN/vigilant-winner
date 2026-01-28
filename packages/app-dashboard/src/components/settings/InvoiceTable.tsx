'use client'

/**
 * InvoiceTable Component
 *
 * Displays billing invoice history.
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
} from '@bundlenudge/shared-ui'
import { Download, ExternalLink } from 'lucide-react'

type InvoiceStatus = 'paid' | 'open' | 'draft' | 'void' | 'uncollectible'

interface Invoice {
    id: string
    invoiceDate: number
    amountCents: number
    status: InvoiceStatus
    invoicePdf?: string
    stripeInvoiceId?: string
}

interface InvoiceTableProps {
    invoices: Invoice[]
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
    if (invoices.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                No invoices yet
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
            </TableBody>
        </Table>
    )
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    const invoiceDate = new Date(invoice.invoiceDate * 1000)
    const amount = (invoice.amountCents / 100).toFixed(2)

    const statusVariant = getStatusVariant(invoice.status)

    return (
        <TableRow>
            <TableCell>{dateFormatter.format(invoiceDate)}</TableCell>
            <TableCell>${amount}</TableCell>
            <TableCell>
                <Badge variant={statusVariant}>
                    {formatStatus(invoice.status)}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                {invoice.invoicePdf && (
                    <Button variant="ghost" size="sm" asChild>
                        <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Download className="mr-1 h-4 w-4" />
                            PDF
                        </a>
                    </Button>
                )}
                {invoice.stripeInvoiceId && (
                    <Button variant="ghost" size="sm" asChild>
                        <a
                            href={`https://dashboard.stripe.com/invoices/${invoice.stripeInvoiceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            View
                        </a>
                    </Button>
                )}
            </TableCell>
        </TableRow>
    )
}

function getStatusVariant(
    status: InvoiceStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'paid':
            return 'default'
        case 'open':
            return 'secondary'
        case 'void':
        case 'uncollectible':
            return 'destructive'
        default:
            return 'outline'
    }
}

function formatStatus(status: InvoiceStatus): string {
    switch (status) {
        case 'paid':
            return 'Paid'
        case 'open':
            return 'Open'
        case 'draft':
            return 'Draft'
        case 'void':
            return 'Void'
        case 'uncollectible':
            return 'Uncollectible'
        default:
            return status
    }
}
