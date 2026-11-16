from fastapi import APIRouter
from app.api.v1 import (
    employees,
    pods,
    brands,
    processes,
    working_rules,
    assignments,
    leaves,
    holidays,
    rosters,
    dashboard,
    reports,
)

api_router = APIRouter()

api_router.include_router(employees.router)
api_router.include_router(pods.router)
api_router.include_router(brands.router)
api_router.include_router(processes.router)
api_router.include_router(working_rules.router)
api_router.include_router(assignments.router)
api_router.include_router(leaves.router)
api_router.include_router(holidays.router)
api_router.include_router(rosters.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
