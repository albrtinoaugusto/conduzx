/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Documentos até 5 MB (+ margem para os restantes campos do formulário)
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Grafia alternativa usada em materiais antigos
  async redirects() {
    return [{ source: "/privary", destination: "/privacy", permanent: true }];
  },
};

export default nextConfig;
