/* Month names (English/Hindi). */
/* ---------- PDF preview, export, copy: small icon buttons next to Mark range ---------- */
const HI_MONTHS = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
const monthLong = (y,m) => lang==="hi" ? HI_MONTHS[m-1] : new Date(y,m-1,1).toLocaleString(locale(),{month:"long"});
