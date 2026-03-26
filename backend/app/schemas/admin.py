from pydantic import BaseModel


class DashboardOut(BaseModel):
    total_users: int
    total_orders: int
    revenue_delivered: float
    low_stock_count: int


class OrderDayPoint(BaseModel):
    date: str
    orders: int
