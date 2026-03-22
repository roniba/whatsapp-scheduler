interface Props {
  dataUrl: string;
}

export default function QRCodeDisplay({ dataUrl }: Props) {
  return (
    <div className="qr-wrapper">
      <img src={dataUrl} alt="WhatsApp QR Code" className="qr-image" />
      <p className="qr-hint">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device</p>
    </div>
  );
}
