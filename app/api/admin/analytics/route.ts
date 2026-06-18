import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin, apiResponse, apiError } from "@/lib/auth/middleware";

// GET /api/admin/analytics
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      newCustomers,
      todayRevenue,
      todayOrders,
      ordersByStatus,
      revenueByDay,
      topProducts,
      recentOrders,
      lowStockProducts,
      pendingWithdrawals,
    ] = await prisma.$transaction([
      // Total revenue (completed payments)
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true,
      }),

      // Total orders
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),

      // Total customers
      prisma.user.count({ where: { role: "CUSTOMER" } }),

      // New customers in period
      prisma.user.count({
        where: { role: "CUSTOMER", createdAt: { gte: startDate } },
      }),

      // Today's revenue
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { amount: true },
      }),

      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
        orderBy: { _count: { status: 'desc' } },
        where: { createdAt: { gte: startDate } },
      }),

      // Revenue by day (last 30 days)
      prisma.$queryRaw`
        SELECT
          DATE("createdAt") as date,
          COUNT(*)::int as orders,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments
        WHERE status = 'COMPLETED'
          AND "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,

      // Top selling products
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, total: true },
        _count: true,
        where: { order: { createdAt: { gte: startDate }, paymentStatus: "COMPLETED" } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),

      // Low stock products
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          stock: { lte: 10, gt: 0 },
        },
        select: { id: true, name: true, sku: true, stock: true, lowStockAlert: true, thumbnail: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),

      // Pending withdrawals count
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of ordersByStatus) {
      statusMap[(row as any).status] = (row as any)._count;
    }

    const topProductsFormatted = (topProducts as any[]).map((p) => ({
      id: p.productId,
      name: p.productName,
      totalSold: p._sum?.quantity || 0,
      revenue: Number(p._sum?.total || 0),
      price: Number(p._sum?.total || 0) / Math.max(1, p._sum?.quantity || 1),
    }));

    return apiResponse({
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      totalOrders,
      totalCustomers,
      newCustomers,
      todayRevenue: Number(todayRevenue._sum.amount || 0),
      todayOrders,
      pendingWithdrawals,
      avgOrderValue: totalRevenue._count > 0
        ? (Number(totalRevenue._sum.amount || 0) / totalRevenue._count).toFixed(2)
        : "0",
      revenueChange: null,
      ordersChange: null,
      customersChange: null,
      ordersByStatus: statusMap,
      revenueByDay: (revenueByDay as any[]).map((r) => ({
        date: String(r.date).slice(0, 10),
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })).reverse(),
      topProducts: topProductsFormatted,
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("[Admin/Analytics/GET]", error);
    return apiError("Failed to fetch analytics", 500);
  }
}
