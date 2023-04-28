// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   output: 'export',
//   distDir: './build',
// }

// module.exports = nextConfig
module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/:path*",
      },
    ];
  };
  return {
    rewrites,
  };
};