import time


def test_job_submission_and_polling(client, sample_jpeg_bytes):
    # 1. Submit job with multipart form file
    files = {"file": ("test_scan.jpg", sample_jpeg_bytes, "image/jpeg")}
    response = client.post("/api/ai/jobs", files=files)
    assert response.status_code == 202
    data = response.json()
    assert "jobId" in data
    assert data["status"] == "QUEUED"

    job_id = data["jobId"]

    # 2. Poll job status until COMPLETED or FAILED
    max_retries = 20
    final_status = None
    for _ in range(max_retries):
        status_res = client.get(f"/api/ai/jobs/{job_id}")
        assert status_res.status_code == 200
        status_data = status_res.json()
        final_status = status_data["status"]
        if final_status in ["COMPLETED", "FAILED"]:
            break
        time.sleep(0.1)

    assert final_status == "COMPLETED"
    assert status_data["progress"] == 100
    assert status_data["result"] is not None
    assert status_data["result"]["prediction"]["label"] == "DEMO_MODE"


def test_job_status_not_found(client):
    response = client.get("/api/ai/jobs/non_existent_job_id_999")
    assert response.status_code == 404
