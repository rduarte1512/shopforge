import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { buildFinanceCsv, buildSimpleFinancePdf, getFinancialOverviewForUser } from '@/lib/finance-actions';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId');
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
  const data = await getFinancialOverviewForUser(userId, storeId);

  if (format === 'pdf') {
    const pdf = buildSimpleFinancePdf(data);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="shopforge-financeiro.pdf"',
      },
    });
  }

  const csv = buildFinanceCsv(data);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shopforge-financeiro.csv"',
    },
  });
}
