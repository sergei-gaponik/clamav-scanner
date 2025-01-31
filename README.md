# clamav-scanner

ClamAV scanner with a REST API. This service will download the file from the given URL and scan it with ClamAV.

## Installation

```bash
docker-compose build
docker-compose up
```

## Usage

```bash
curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"downloadUrl": "https://www.eicar.org/download/eicar-com-2/?wpdmdl=8842&refresh=679cf8f3441341738340595"}'
```

See `example.sh` for more examples.
