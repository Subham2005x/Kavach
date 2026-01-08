#!/usr/bin/env python3
"""
IMMEDIATE SMS TESTING SCRIPT
Run this to verify SMS is being attempted
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# Simulate alert data
alert_data = {
    'level': 'WARNING',
    'type': 'Test Alert',
    'value': 75,
    'threshold': 50,
    'message': 'This is a test alert from Kavach',
    'location': 'Kolkata, India',
    'timestamp': '2026-01-08 16:25:00'
}

phone = '9163615366'

print("=" * 60)
print("TESTING SMS FUNCTIONALITY")
print("=" * 60)

# Test 1: Check Fast2SMS
print("\n1. Testing Fast2SMS...")
fast2sms_key = os.getenv('FAST2SMS_API_KEY')
if fast2sms_key:
    print(f"   API Key: {fast2sms_key[:20]}...")
    
    try:
        import httpx
        async def test_fast2sms():
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://www.fast2sms.com/dev/bulkV2',
                    headers={
                        'authorization': fast2sms_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'route': 'q',
                        'message': f"KAVACH: {alert_data['message']}",
                        'language': 'english',
                        'flash': 0,
                        'numbers': phone
                    },
                    timeout=10.0
                )
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status_code') == 999:
                        print("   ❌ REQUIRES PAYMENT: Add ₹100 to Fast2SMS account")
                        return False
                    print("   ✅ SMS SENT!")
                    return True
                else:
                    print("   ❌ Failed to send")
                    return False
        
        result = asyncio.run(test_fast2sms())
    except Exception as e:
        print(f"   ❌ Error: {e}")
else:
    print("   ❌ No API key configured")

# Test 2: Check Twilio
print("\n2. Testing Twilio...")
twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')

if all([twilio_sid, twilio_token, twilio_phone]):
    print(f"   Account SID: {twilio_sid[:20]}...")
    try:
        from twilio.rest import Client
        client = Client(twilio_sid, twilio_token)
        message = client.messages.create(
            body=f"🚨 KAVACH TEST: {alert_data['message']}",
            from_=twilio_phone,
            to=f"+91{phone}"
        )
        print(f"   ✅ SMS SENT! (SID: {message.sid})")
        print(f"   Status: {message.status}")
    except ImportError:
        print("   ❌ Twilio not installed. Run: pip install twilio")
    except Exception as e:
        print(f"   ❌ Error: {e}")
else:
    print("   ❌ Twilio not configured")
    print("   💡 Quick setup:")
    print("      1. Go to https://www.twilio.com/try-twilio")
    print("      2. Get FREE trial account")
    print("      3. Add to .env:")
    print("         TWILIO_ACCOUNT_SID=ACxxxx")
    print("         TWILIO_AUTH_TOKEN=xxxx")
    print("         TWILIO_PHONE_NUMBER=+1234567890")

# Test 3: Demo Mode
print("\n3. Demo Mode (Fallback):")
print(f"   📱 SMS ALERT")
print(f"   To: {phone}")
print(f"   Level: {alert_data['level']}")
print(f"   Type: {alert_data['type']}")
print(f"   Message: {alert_data['message']}")
print(f"   Location: {alert_data['location']}")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
print("=" * 60)
print("✅ BEST OPTION: Setup Twilio (FREE trial, works immediately)")
print("   Time: 5 minutes | Cost: $0 | SMS: 400+")
print("\n⚠️  Alternative: Pay Fast2SMS ₹100")
print("=" * 60)
