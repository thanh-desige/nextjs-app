/**
 * CAD Application Test Route
 * Access via: http://localhost:3000/cad
 */

import BookThietKeBocTachPage from "@/TrangChuAlubok/book/BookThietKeBocTach/src/BookThietKeBocTachPage";

export default function CadPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <BookThietKeBocTachPage />
    </div>
  );
}
