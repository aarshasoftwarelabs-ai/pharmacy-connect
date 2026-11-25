# DavaSetu POS (v3.0) — Chemist & Doctor Software Guide

> **Platform:** Cloud Pharmacy POS — **PC / Windows Desktop App (Electron + Web)** + **Android Mobile App (Flutter)**  
> **Note:** આ ડોક્યુમેન્ટમાં ફક્ત એ જ ફીચર્સ, પ્લાન્સ અને વિગતો લખેલા છે જે સોફ્ટવેરમાં ખરેખર ઉપલબ્ધ અને કાર્યરત છે (કોઈ ડમી કે વધારાની વિગતો ઉમેરેલી નથી).

---

## ૧. DavaSetu શું છે? (ટૂંકો પરિચય)

**DavaSetu** મેડિકલ સ્ટોર્સ અને ક્લિનિક/ડિસ્પેન્સરી ચલાવતા **કેમિસ્ટ્સ અને ડોક્ટર્સ** માટે બનાવેલું ઓલ-ઇન-વન **Cloud Pharmacy Management & Billing Software** છે.

- **PC / Laptop (Windows Desktop App & Web Browser)** અને **Mobile App (Android)** બંને એક જ ક્લાઉડ ડેટાબેઝ સાથે રીઅલ-ટાઇમમાં સિંક રહે છે.
- સ્ટોર પર ઈન્ટરનેટ બંધ હોય ત્યારે પણ **Offline Billing** ચાલુ રહે છે અને ઈન્ટરનેટ પાછું આવતાં જ બિલ્સ ઓટોમેટિક ક્લાઉડ પર સિંક થઈ જાય છે.

---

## ૨. કેમિસ્ટ અને ડોક્ટર માટે ઉપયોગી મુખ્ય ફીચર્સ

### A. ફાસ્ટ POS બિલિંગ (PC અને Mobile બંનેમાં)
1. **બારકોડ સ્કેનિંગ (USB + Mobile Camera + Wireless Sync):**
   - PC પર **USB Barcode Scanner** થી સીધું સ્કેન કરીને બિલ બનાવી શકાય છે.
   - **Mobile-to-PC Live Wireless Sync:** મોબાઈલ કેમેરાથી દવાનો બારકોડ સ્કેન કરો એટલે તે દવા તરત જ PC POS ના બિલ કાર્ટમાં લાઈવ ઉમેરાઈ જાય છે.
2. **Full Strip vs Loose Tablet Cut Billing:**
   - ગ્રાહક આખી સ્ટ્રિપ લે કે છૂટી ગોળી (દા.ત. ૨ કે ૫ ટેબ્લેટ), સિંગલ બટનથી **Loose Tab** સિલેક્ટ કરી શકાય છે — ભાવ અને સ્ટોક કપાત ઓટોમેટિક સ્ટ્રિપ-પેક મુજબ ગણાય છે.
3. **1-Click Generic Salt Substitute Finder (વૈકલ્પિક બ્રાન્ડ):**
   - જો કોઈ બ્રાન્ડ **Out of Stock** હોય અથવા વિકલ્પ જોવો હોય, તો સોફ્ટવેર એ જ **Generic Salt (કમ્પોઝિશન)** વાળી સ્ટોકમાં ઉપલબ્ધ બીજી બ્રાન્ડ્સ તરત બતાવે છે.
4. **AI Prescription Scanner:**
   - પ્રિસ્ક્રિપ્શનનો ફોટો/PDF અપલોડ કરવાથી AI દર્દીનું નામ અને દવાઓનું લિસ્ટ વાંચીને બિલ કાર્ટમાં ઉમેરે છે.
5. **GST અને પ્રિન્ટિંગ સપોર્ટ:**
   - `0%`, `5%`, `12%`, `18%`, `28%` GST સ્લેબ (CGST / SGST / Taxable Amount) સાથે બિલ.
   - **Thermal 58mm**, **Thermal 80mm**, અને **A4** પ્રિન્ટ ફોર્મેટ (Windows Desktop App માં ડાયરેક્ટ Silent Thermal Printing સપોર્ટ સાથે).
6. **WhatsApp ડિજિટલ બિલ:**
   - બિલ બનતાં જ ગ્રાહકના WhatsApp નંબર પર બિલની ડિટેલ મોકલી શકાય છે (Settings માંથી WhatsApp/Auto-Print ચાલુ કે બંધ કરી શકાય છે).

---

### B. FDCA & CDSCO કમ્પ્લાયન્સ — Schedule H1 Digital Register (ડોક્ટર અને કેમિસ્ટ બંને માટે ખાસ)
- Drugs and Cosmetics Rules, 1945 ના **Rule 65 & 97** મુજબ **Schedule H1 & Narcotic Digital Statutory Register** બનેલું છે.
- બિલ બનાવતી વખતે **Prescribing Doctor Name** દાખલ કરવાનો વિકલ્પ મળે છે.
- Schedule H1 કેટેગરીની દવા (દા.ત. Alprazolam, Tramadol, Cefixime, Clonazepam, Zolpidem વગેરે) બિલ થાય એટલે તે **ઓટોમેટિક Schedule H1 Register માં નોંધાઈ જાય છે** (દર્દીનું નામ, ફોન, ડોક્ટરનું નામ, દવા, બેચ નંબર, જથ્થો અને તારીખ સાથે).
- ઈન્સ્પેક્શન માટે **Print FDCA Register** અને જરૂર મુજબ **Manual Entry** ની સુવિધા પણ છે.

---

### C. સ્માર્ટ ઈન્વેન્ટરી, એક્સપાયરી રિટર્ન અને શોર્ટેજ બુક
1. **Batch-wise Stock & FEFO Deduction:**
   - દરેક દવાના અલગ-અલગ **Batch Number, Expiry Date, MRP, Purchase Price** ટ્રેક થાય છે. બિલ બને ત્યારે નજીકની એક્સપાયરી વાળો બેચ (**FEFO — First Expired, First Out**) પહેલા કપાય છે.
2. **Barcode Sticker Printing:**
   - જે દવામાં બારકોડ ન હોય તેના માટે **Auto-Barcode Generate** કરી શકાય છે અને `50x25mm`, `38x25mm`, અથવા `A4 Sheet` પર બારકોડ સ્ટિકર પ્રિન્ટ કરી શકાય છે.
3. **Expiry Alert & Return to Distributor (Debit Note / Return Challan):**
   - **Already Expired**, **30 દિવસ (Critical)**, **60 દિવસ (Warning)**, અને **90 દિવસ (Upcoming)** મુજબ દવાઓ અલગ દેખાય છે અને સીધો ડિસ્ટ્રીબ્યુટરને **Return Challan** બનાવી/પ્રિન્ટ કરી શકાય છે.
4. **Shortage Book (કમી-બુક):**
   - ઓછા સ્ટોક કે Out-of-Stock દવાઓની યાદી ઓટોમેટિક તૈયાર થાય છે અને **1-Click WhatsApp Order** દ્વારા સીધી ડિસ્ટ્રીબ્યુટરને મોકલી શકાય છે.
5. **Dead Stock & Clearance:**
   - લાંબા સમયથી ન વેચાયેલો સ્ટોક અને તેમાં ફસાયેલી મૂડી (**Blocked Capital**) ટ્રેક થાય છે.
6. **1-Click Smart Migration (CSV/Excel Import):**
   - જૂના સોફ્ટવેરમાંથી દવાઓનું લિસ્ટ CSV/Excel દ્વારા બલ્કમાં ઈમ્પોર્ટ કરી શકાય છે.
7. **AI Medicine Box OCR (Mobile & Backend):**
   - દવાના બોક્સનો ફોટો સ્કેન કરીને દવાનું નામ, બેચ, એક્સપાયરી અને MRP ઓટો-ફિલ કરી શકાય છે.

---

### D. હોલસેલ પરચેઝ (Purchases), સ્કીમ (10+1 Free) અને સપ્લાયર્સ
- **Purchase Invoice Entry & AI Bill Scan:** હોલસેલ ડિસ્ટ્રીબ્યુટરનું બિલ મેન્યુઅલી અથવા **AI Bill Scan** (ફોટો અપલોડ) થી ચઢાવી શકાય છે.
- **Scheme / Free Quantity Support (દા.ત. 10 + 1 Free):** Paid Qty સાથે Free Qty નાખવાથી સિસ્ટમ **Effective Landed Purchase Price** અને સ્ટોક ઓટોમેટિક ગણી લે છે.
- **Suppliers & Distributors Ledger:** સપ્લાયરની GSTIN, Drug License નંબર, Credit Period અને Pending Balance ટ્રેક થાય છે.

---

### E. CA / GST ફાઈલિંગ, રિપોર્ટ્સ અને કસ્ટમર હિસ્ટ્રી
- **Reports Module:**
  - **Sales Report**, **Billing Report**, **Medicine-wise Sales**, **Customer Report**, અને **Medicine Requests Summary**.
- **CA / GST Filing Tab:**
  - **GSTR-1** (B2B, B2CS, HSN Summary, Documents), **GSTR-2** (Purchase B2B, Rate-wise, HSN, Supplier), અને **GSTR-3B** સારાંશ (Print / JSON / Export સપોર્ટ સાથે).
- **Customers & Refill Reminders:**
  - દરેક ગ્રાહકની બિલ હિસ્ટ્રી અને નિયમિત દવાઓ માટે **Refill Reminders** ટ્રેક થાય છે.

---

### F. સ્ટાફ મેનેજમેન્ટ અને સુરક્ષા (Role-Based Access)
- **Owner Login:** Password અથવા Email OTP દ્વારા લોગિન.
- **Staff 4-Digit PIN Login:** સ્ટાફ (`MANAGER`, `PHARMACIST`, `BILLER`) પોતાના મોબાઈલ નંબર અને **4-અંકના PIN** થી લોગિન કરી શકે છે.
- **Granular Permissions:** માલિક નક્કી કરી શકે છે કે કયો સ્ટાફ કયું મોડ્યુલ (Billing, Inventory, Purchases, Reports, Settings વગેરે) જોઈ કે વાપરી શકે.
- **Mobile Staff Scanner Mode:** મોબાઈલમાં સ્ટાફ લોગિન કરે ત્યારે સીધો ફાસ્ટ બારકોડ સ્કેનર + બિલિંગ મોડ ખુલે છે.

---

## ૩. ડોક્ટર માટે આ સોફ્ટવેર કેવી રીતે ઉપયોગી છે?

જો ડોક્ટરનું પોતાનું **ક્લિનિક / ઈન-હાઉસ મેડિકલ (Dispensary)** હોય, તો:
1. પ્રિસ્ક્રિપ્શન લખ્યા પછી કાઉન્ટર પર ફાસ્ટ બિલિંગ, **Loose Tablet** ડિસ્પેન્સિંગ અને **Batch/Expiry ટ્રેકિંગ** એક જ જગ્યાએ થાય છે.
2. **Schedule H1 Digital Register** ઓટોમેટિક મેઈન્ટેઈન થાય છે (દર્દી, ડોક્ટર, દવા અને બેચ રેકોર્ડ સાથે), જે FDCA તપાસમાં મદદરૂપ થાય છે.
3. જો સ્ટોરમાં કોઈ બ્રાન્ડ ખલાસ થઈ હોય તો **Generic Salt Substitutes** તરત દેખાય છે.
4. મોબાઈલ એપથી ડોક્ટર/માલિક બહારથી પણ લાઈવ સેલ્સ અને સ્ટોક ચેક કરી શકે છે.

---

## ૪. ઉપલબ્ધ પ્લાન્સ અને પ્રાઈસિંગ (Settings માંથી Upgrade)

- **Free Trial:** નવા એકાઉન્ટ પર **15 દિવસ / 14 દિવસ** ફ્રી ટ્રાયલ (PC પર Settings માં 15 દિવસ ટ્રાયલ ચેક અને Early Adopter Offer હેઠળ પ્રથમ ૨૦ ફાર્મસી માટે **5% OFF** — Code: `DAVA5`).

| પ્લાનનું નામ | કિંમત (Regular) | Early Adopter (5% OFF) | સમયગાળો | મુખ્ય સુવિધાઓ |
| :--- | :---: | :---: | :---: | :--- |
| **Mobile-Only Pro** | ₹1,499 | ₹1,424 | ૧ વર્ષ | ફક્ત Mobile App માટે (PC વગરના સ્ટોર માટે), Bluetooth Thermal Print, Camera Barcode, WhatsApp બિલ |
| **Monthly Pro** | ₹799 | ₹759 | ૧ મહિનો | PC & POS બિલિંગ, Thermal Print, Basic Reports, Mobile App (1 Phone) |
| **Half-Yearly Pro** | ₹3,499 | ₹3,324 | ૬ મહિના | Monthly ના બધા ફીચર્સ + Smart Inventory, Expiry Returns, Schedule H1 Register, Mobile + Cloud Sync |
| **Yearly Premium** | ₹5,999 | ₹5,699 | ૧ વર્ષ | બધા ફીચર્સ + AI Smart Inventory, Multi-Device Cloud Sync, Staff Scanners, Priority Support (₹16/day) |
| **Founder's Lifetime** | ₹24,999 | ₹23,749 | Lifetime | કોઈ વાર્ષિક રિન્યૂઅલ નહીં, Lifetime PC + Mobile Sync, Unlimited Staff Scanner Seats, VIP Support |

---

## ૫. સપોર્ટ અને સંપર્ક (Help & Support પેજ મુજબ)

- **WhatsApp / Helpline Call:** `+91 96647 81007`
- **Email Support:** `davasetu.otp@gmail.com`
- **Software Version:** `DavaSetu POS v3.0`
