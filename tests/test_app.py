from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic sanity check for a known activity
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "test_student@example.com"

    # Ensure clean state (remove if present)
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    if email in participants:
        client.delete(f"/activities/{activity}/participant?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Verify participant present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Remove participant
    resp = client.delete(f"/activities/{activity}/participant?email={email}")
    assert resp.status_code == 200
    assert "Removed" in resp.json().get("message", "")

    # Verify removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
