# Picture of the day.
Picture Of The Day CLI tool. Downloads the latest picture of the day from NASA.

### requirements
node

npm

NASA api key. Get one at https://api.nasa.gov

### installation
```
git clone https://github.com/myleftfoot/potd.git
npm install
npm link
```

### usage
`potd --api_key YOUR_KEY --destination .`

Alternativly, you can store your key and destination in your home folder in the ~/.potd/config.json file.
```
{
  "api_key": "YOUR_API_KEY",
  "destination_folder": "/home/yourfolder"
}
```
