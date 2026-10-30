"""Ephemeral integration setup: deploy three contracts and seed two synthetic users.

Used only by isolated GitHub Actions QA with a disposable PostgreSQL and Ganache.
The fixed test key and phone numbers are NOT real credentials.
"""
import json
import os
import sys
import time
from pathlib import Path

from web3 import Web3

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(os.environ.get("MONO_BACKEND_DIR", ROOT.parent / "backend"))
sys.path.insert(0, str(BACKEND))
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
for attempt in range(30):
    if w3.is_connected():
        break
    time.sleep(1)
else:
    raise RuntimeError("Ephemeral Ganache did not start")
assert w3.eth.chain_id == 1337

contract_env = {}
for name, key in [
    ("GroupRegistry", "GROUP_REGISTRY_ADDRESS"),
    ("ContributionRegistry", "CONTRIBUTION_REGISTRY_ADDRESS"),
    ("CredentialRegistry", "CREDENTIAL_REGISTRY_ADDRESS"),
]:
    artifact_path = BACKEND / "blockchain" / "abi" / f"{name}.json"
    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    factory = w3.eth.contract(abi=artifact["abi"], bytecode=artifact["bytecode"])
    tx_hash = factory.constructor().transact({"from": w3.eth.accounts[0]})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    assert receipt.status == 1, f"{name} deployment failed"
    contract_env[key] = receipt.contractAddress
    os.environ[key] = receipt.contractAddress
    print(f"QA CONTRACT {name} deployed on Ganache chain 1337")
if os.getenv("GITHUB_ENV"):
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as out:
        for key, value in contract_env.items():
            out.write(f"{key}={value}\n")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_integration")
import django
django.setup()

from accounts.models import User
from identity.services.did_service import DIDService

for phone in ("+258841000001", "+258841000002"):
    if User.objects.filter(phone_number=phone).exists():
        raise RuntimeError("Expected a disposable, empty database")
    user = User.objects.create_user(
        phone_number=phone,
        password="qa-synthetic-password-2026",
    )
    user.first_name = "Gestor" if phone.endswith("1") else "Membro"
    user.last_name = "Teste"
    user.save(update_fields=["first_name", "last_name"])
    DIDService.create_for_user(user=user)
print("QA DATA: synthetic manager and holder created; no real participants")
