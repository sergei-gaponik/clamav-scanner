# clamav-scanner

ClamAV scanner with a REST API. This service will download the file from the given URL and scan it with ClamAV.

## Installation

```bash
docker-compose build
docker-compose up
```

## Usage

### Synchronous Scan

Scans the file and returns the result immediately:

```bash
curl -X POST http://localhost:3000/scan \
 -H "Content-Type: application/json" \
 -d '{
"downloadUrl": "https://example.com/file-to-scan.pdf"
}'
```

### Asynchronous Scan

Returns a requestId immediately and scans in the background:

```bash
curl -X POST http://localhost:3000/scan-async \
 -H "Content-Type: application/json" \
 -d '{
"downloadUrl": "https://example.com/file-to-scan.pdf"
}'
```

### Check Status

Use the requestId from the async scan response:

```bash
curl http://localhost:3000/status/<requestId>
```
