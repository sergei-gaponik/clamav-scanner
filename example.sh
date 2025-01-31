curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"downloadUrl": "https://www.eicar.org/download/eicar-com-2/?wpdmdl=8842&refresh=679cf8f3441341738340595"}'

# Example of async scan - stores the requestId
curl -X POST http://localhost:3000/scan-async \
  -H "Content-Type: application/json" \
  -d '{"downloadUrl": "https://www.eicar.org/download/eicar-com-2/?wpdmdl=8842&refresh=679cf8f3441341738340595"}' \
  -o response.json

# Extract requestId from response and check status
REQUEST_ID=$(cat response.json | jq -r '.requestId')
curl "http://localhost:3000/status/$REQUEST_ID"

# Cleanup
rm response.json

