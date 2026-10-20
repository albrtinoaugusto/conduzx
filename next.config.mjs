/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Documentos até 5 MB (+ margem para os restantes campos do formulário)
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
