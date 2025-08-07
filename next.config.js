/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID,
    QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET,
    QUICKBOOKS_REDIRECT_URI: process.env.QUICKBOOKS_REDIRECT_URI,
    AZURE_SQL_SERVER: process.env.AZURE_SQL_SERVER,
    AZURE_SQL_DATABASE: process.env.AZURE_SQL_DATABASE,
    AZURE_SQL_USERNAME: process.env.AZURE_SQL_USERNAME,
    AZURE_SQL_PASSWORD: process.env.AZURE_SQL_PASSWORD,
  }
}

module.exports = nextConfig