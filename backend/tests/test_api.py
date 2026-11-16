"""
RosterIQ API Tests
"""
import pytest
import pytest_asyncio
import httpx
from app.main import app


@pytest_asyncio.fixture
async def client():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoints(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_employees_endpoints(client):
    response = await client.get("/api/v1/employees")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 36

    count_resp = await client.get("/api/v1/employees/count")
    assert count_resp.status_code == 200
    assert count_resp.json()["total"] >= 36


@pytest.mark.asyncio
async def test_pods_endpoints(client):
    response = await client.get("/api/v1/pods")
    assert response.status_code == 200
    pods = response.json()
    assert len(pods) == 6


@pytest.mark.asyncio
async def test_brands_endpoints(client):
    response = await client.get("/api/v1/brands")
    assert response.status_code == 200
    brands = response.json()
    assert len(brands) == 20
    single = [b for b in brands if b["resource_type"] == "single"]
    assert len(single) >= 16


@pytest.mark.asyncio
async def test_processes_endpoints(client):
    response = await client.get("/api/v1/processes")
    assert response.status_code == 200
    processes = response.json()
    assert len(processes) >= 5


@pytest.mark.asyncio
async def test_dashboard_endpoint(client):
    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_employees"] >= 36
    assert data["total_brands"] == 20


@pytest.mark.asyncio
async def test_roster_endpoints(client):
    response = await client.get("/api/v1/rosters")
    assert response.status_code == 200
    periods = response.json()
    assert isinstance(periods, list)
    if len(periods) > 0:
        period_id = periods[0]["id"]
        cov_resp = await client.get(f"/api/v1/rosters/coverage/list?period_id={period_id}")
        assert cov_resp.status_code == 200
        conf_resp = await client.get(f"/api/v1/rosters/conflicts/list?period_id={period_id}")
        assert conf_resp.status_code == 200
