import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

export function DisclaimerDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: "12px",
            fontFamily: "Inter, sans-serif"
          }}
        >
          Disclaimer & AI Usage Policy
        </button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6">Disclaimer & Kebijakan Penggunaan AI</DialogTitle>
            <DialogDescription asChild>
              <div className="p-6">
                <div className="space-y-4 [&_strong]:font-semibold [&_strong]:text-text-primary text-text-secondary text-sm leading-relaxed">
                  <div className="space-y-1">
                    <p>
                      <strong>Sifat Analisis S.A.F.E House</strong>
                    </p>
                    <p>
                      Platform S.A.F.E House menyediakan analisis awal (screening) berbasis data geospasial terbuka (OpenStreetMap, Copernicus) dan algoritma Kecerdasan Buatan (AI). Hasil audit properti, simulasi gempa (PGA), dan zona rawan banjir yang ditampilkan adalah sekadar estimasi dan <strong>bukan pengganti audit teknis profesional</strong> oleh insinyur sipil atau ahli geoteknik berlisensi.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Ketidakpastian Model AI (Halusinasi)</strong>
                    </p>
                    <p>
                      Laporan yang dihasilkan oleh model bahasa (LLM) seperti Gemini dan Ollama dapat mengalami ketidakakuratan atau halusinasi. Meskipun sistem ini menggunakan teknik RAG dan verifikasi geospasial, pengguna diwajibkan untuk memverifikasi ulang setiap klaim struktural maupun analisis lingkungan sebelum mengambil keputusan finansial, hukum, atau pembelian properti.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Keterbatasan Data Geospasial</strong>
                    </p>
                    <p>
                      Data topografi, jarak ke patahan sesar, dan elevasi diambil dari layanan pihak ketiga yang mungkin memiliki latensi pembaruan atau margin of error. S.A.F.E House tidak bertanggung jawab atas kerugian materi yang timbul akibat ketidakcocokan data dengan kondisi asli di lapangan.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Privasi & Keamanan Data Koordinat</strong>
                    </p>
                    <p>
                      Koordinat lokasi dan alamat yang dicari dalam platform ini diproses dalam waktu nyata. Kami tidak menyimpan histori penelusuran Anda pada server permanen kami melainkan hanya di local storage peramban web Anda. Data hanya dikirimkan ke provider AI (Google/OpenRouter) untuk tujuan analisis sesaat.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 pb-6 sm:justify-end border-t border-white/10 pt-4 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="mr-2">
                Tutup
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="button" variant="default">
                Saya Mengerti
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
