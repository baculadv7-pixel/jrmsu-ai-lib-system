import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { listUserQRCodesForAdmin, generateUserQR } from "@/services/qr";
import QRCodeDisplay, { downloadCanvasAsPng } from "@/components/qr/QRCodeDisplay";

const AppAdminQRs = () => {
  const userType: "student" | "admin" = "admin";
  const [items, setItems] = useState<Array<{ userId: string; imageUrl?: string; envelope?: string }>>([]);

  useEffect(() => {
    (async () => {
      const list = await listUserQRCodesForAdmin();
      // For demo, if backend is not ready, build a few placeholder envelopes
      if (!list.length) {
        const demo = ["u1", "u2", "u3"].map((u) => ({ userId: u }));
        setItems(await Promise.all(demo.map(async (d) => ({ ...d, envelope: (await generateUserQR({ userId: d.userId })).envelope }))));
      } else {
        setItems(list);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      <div className="flex">
        <Sidebar userType={userType} />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>All User QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((it) => (
                    <div key={it.userId} className="flex flex-col items-center gap-2">
                      <div className="h-40 w-40 bg-white rounded-lg flex items-center justify-center">
                        <QRCodeDisplay data={it.envelope || JSON.stringify({ uid: it.userId })} size={160} centerLabel="JRMSU–KCS" />
                      </div>
                      <div className="text-sm font-medium">{it.userId}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const container = document.querySelector(`div[data-uid='${it.userId}']`) || undefined;
                          const card = container || document.querySelector(".h-40.w-40:last-of-type");
                          const canvas = (card as Element | undefined)?.querySelector("canvas") as HTMLCanvasElement | undefined;
                          if (canvas) downloadCanvasAsPng(canvas, `${it.userId}-qr.png`);
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
};

export default AppAdminQRs;


