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

export function FaqDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          type="button"
          aria-haspopup="dialog"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: "12px",
            minHeight: "44px",
            padding: "0 8px",
            fontFamily: "Inter, sans-serif"
          }}
        >
          FAQ (Tanya Jawab)
        </button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6">Frequently Asked Questions (FAQ)</DialogTitle>
            <DialogDescription asChild>
              <div className="p-6">
                <div className="space-y-4 [&_strong]:font-semibold [&_strong]:text-text-primary text-text-secondary text-sm leading-relaxed">
                  <div className="space-y-1">
                    <p>
                      <strong>Apa itu S.A.F.E House?</strong>
                    </p>
                    <p>
                      S.A.F.E House adalah platform audit lokasi berbasis AI yang membantu Anda menilai potensi risiko bencana (seperti gempa dan banjir) serta kondisi lingkungan di sekitar suatu properti atau lokasi.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Bagaimana AI menghasilkan laporan audit?</strong>
                    </p>
                    <p>
                      Sistem kami mengumpulkan data geospasial dari berbagai sumber terbuka, lalu menggunakan model Kecerdasan Buatan (AI) canggih untuk menganalisis dan merangkum informasi tersebut menjadi laporan yang mudah dipahami.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Apakah data yang ditampilkan 100% akurat?</strong>
                    </p>
                    <p>
                      Tidak. Data dan analisis yang ditampilkan adalah estimasi berdasarkan data publik yang tersedia. Hasil ini sebaiknya digunakan sebagai referensi awal dan bukan sebagai pengganti survei profesional.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Bagaimana cara menggunakan fitur simulasi gempa?</strong>
                    </p>
                    <p>
                      Anda dapat memasukkan koordinat atau memilih lokasi di peta, lalu menyesuaikan parameter simulasi (seperti nilai PGA) di panel yang tersedia untuk melihat estimasi dampaknya.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>Apakah histori pencarian saya disimpan?</strong>
                    </p>
                    <p>
                      Kami hanya menyimpan histori pencarian Anda di penyimpanan lokal (*local storage*) peramban web Anda. Kami tidak menyimpan data lokasi pribadi Anda di server kami secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 pb-6 sm:justify-end border-t border-white/10 pt-4 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
