import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "72px", margin: "0", color: "#dc143c" }}>404</h1>
      <h2 style={{ fontSize: "24px", margin: "16px 0 24px" }}>
        Trang Không Tồn Tại
      </h2>
      <p style={{ color: "#aaa", maxWidth: "480px", marginBottom: "32px" }}>
        Địa chỉ trang bạn tìm kiếm không có sẵn hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "#dc143c",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Về Trang Chủ
      </Link>
    </div>
  );
}

