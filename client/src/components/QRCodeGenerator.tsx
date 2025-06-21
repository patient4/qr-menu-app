import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Copy, Share2, Plus } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  restaurantId: number;
}

interface TableQR {
  id: string;
  tableNumber: string;
  qrCodeDataUrl: string;
  orderingUrl: string;
  createdAt: Date;
}

export default function QRCodeGenerator({ restaurantId }: QRCodeGeneratorProps) {
  const [tableQRs, setTableQRs] = useState<TableQR[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async (tableNumber: string) => {
    setIsGenerating(true);
    try {
      // Create the ordering URL with table parameter
      const baseUrl = window.location.origin;
      const orderingUrl = `${baseUrl}/customer?restaurant=${restaurantId}&table=${tableNumber}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(orderingUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const newQR: TableQR = {
        id: `qr-${Date.now()}-${tableNumber}`,
        tableNumber,
        qrCodeDataUrl,
        orderingUrl,
        createdAt: new Date()
      };

      setTableQRs(prev => [...prev, newQR]);
      setNewTableNumber("");
      
      toast({
        title: "QR Code Generated!",
        description: `QR code for Table ${tableNumber} is ready for use.`,
      });
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = async (qr: TableQR) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 500;

      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load QR code image
        const img = new Image();
        img.onload = () => {
          // Draw QR code
          ctx.drawImage(img, 50, 50, 300, 300);
          
          // Add restaurant name
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Icy Spicy Tadka', canvas.width / 2, 30);
          
          // Add table number
          ctx.font = 'bold 20px Arial';
          ctx.fillText(`Table ${qr.tableNumber}`, canvas.width / 2, 380);
          
          // Add instructions
          ctx.font = '16px Arial';
          ctx.fillText('Scan to Order', canvas.width / 2, 410);
          ctx.fillText('Pure Vegetarian Restaurant', canvas.width / 2, 430);
          
          // Download
          const link = document.createElement('a');
          link.download = `table-${qr.tableNumber}-qr.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
        img.src = qr.qrCodeDataUrl;
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "Share this link with customers.",
    });
  };

  const generateBulkQRs = async () => {
    setIsGenerating(true);
    const tables = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    
    for (const tableNum of tables) {
      if (!tableQRs.find(qr => qr.tableNumber === tableNum)) {
        await generateQRCode(tableNum);
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input
                id="tableNumber"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Enter table number"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => generateQRCode(newTableNumber)}
                disabled={!newTableNumber || isGenerating}
                className="gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate QR
              </Button>
              <Button
                onClick={generateBulkQRs}
                disabled={isGenerating}
                variant="outline"
              >
                Generate 1-20
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Generate QR codes for tables that customers can scan to access the menu and place orders directly.
          </div>
        </CardContent>
      </Card>

      {tableQRs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableQRs.map((qr) => (
            <Card key={qr.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  Table {qr.tableNumber}
                  <Badge variant="secondary">Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qr.qrCodeDataUrl}
                    alt={`QR Code for Table ${qr.tableNumber}`}
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 break-all">
                    {qr.orderingUrl}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(qr.orderingUrl)}
                      className="flex-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadQR(qr)}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}