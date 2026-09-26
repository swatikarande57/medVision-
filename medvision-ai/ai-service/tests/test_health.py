def test_health_endpoint(client):
    response = client.get("/api/ai/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "medvision-ai"
    assert data["version"] == "2.4.0"
    assert data["modelMode"] in ["DEMO", "PRODUCTION"]
    assert data["device"] in ["CPU", "CUDA"]
