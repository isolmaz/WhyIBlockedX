# Değişiklik günlüğü

## 0.5.2 — 7 Ekim 2026

### Düzeltmeler
- Engelle, sessize al veya geri al başlatılamadığında (önceki işlem sürüyor, hedef hesap bulunamadı, profil güncelleniyor ya da açık bir onay penceresi var) tıklama sessizce yutuluyordu; nedeni artık bildirimde görünür.
- Arka plan geç yanıt verdiğinde profil veya önizleme notu iki kez eklenebiliyordu; panel güncellemeleri artık sırayla çalışır.
- Popup Kayıtlar gibi bir alt sayfadayken kapatılıp yeniden açılınca geri düğmesi kayboluyor, ana sayfaya dönülemiyordu.

### Depo
- `main`’e gelen her değişiklik CI’dan geçer. `manifest.json` sürümü yükseldiğinde paket Chrome Web Store’a yüklenip incelemeye gönderilir ve aynı sürüm GitHub’da yayımlanır (`.github/workflows/release.yml`).

## 0.5.1 — 6 Ekim 2026

### Yeni
- **İngilizce arayüz.** Eklenti tarayıcı dilini izler; **Ayarlar → Görünüm → Dil** ile İngilizce veya Türkçe seçilebilir. Mağaza açıklaması da iki dilde (`_locales`).

### Görünüm
- Popup X’in ölçülerine göre yeniden düzenlendi: 15 px metin, 13 px ikincil metin, 16 px kenar boşluğu, X tarzı sekmeler, arama kutusu ve düğmeler.
- Profil panelinin alt boşluğu üstüyle eşitlendi (12 px).

### Düzeltmeler
- X “Gönder” düğmesini beyaz/gri çizerse bu renk artık vurgu rengi sayılmaz; bildirim okunaksız beyaz zemine düşmez.
- Profil paneli, profil düğmeleri ve işlem bildirimi yazı tipini artık X’in metin öğelerinden alır. X yazı tipini `body` yerine metinlere verdiğinde eklenti tarayıcının varsayılan yazı tipine düşüyordu.
- Popup, X’in yedek yazı tipi sırasını kullanır (`-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`).
- Arka plandaki kullanılmayan `open` mesajı (popup’ı açma) kaldırıldı.

### Depo
- MIT lisansı (`LICENSE`) ve gizlilik politikası (`PRIVACY.md`) eklendi.
- README kısaltıldı ve işlemleri gösteren GIF’ler eklendi.

## 0.5.0 — 27 Eylül 2026

### Görünüm
- Varsayılan tema **X ile aynı** oldu. 0.4.x’ten güncellenip siyah temada kalan kurulumlar bir kez “X ile aynı”ya geçirilir.
- Vurgu rengi (bağlantılar, odak halkası, bildirim) artık sabit mavi değil; X’te seçtiğin vurgu rengi kullanılır.
- İşlem bildirimi X’in kendi bildirimine benzer: vurgu renginde arka plan, X yazı tipi, kalın **Geri al**. Hatalar kırmızı gösterilir.
- Profil düğmeleri boyut, kenarlık ve boşluklarını yanındaki X “⋯” düğmesinden alır.
- Profil paneli tek bir stil dosyasında toplandı ve X ölçülerine göre yeniden düzenlendi.

### Düzeltmeler
- Durumu bilinmeyen sessize alma düğmesi “Sessize alma” yerine “Sessize al / kaldır” yazar.
- Bildirim metni doğal Türkçe: “@kullanici engellendi”.
- Elle kayıt formu arka planla aynı tweet bağlantısı doğrulamasını kullanır (`/photo/1`, `i/web/status` bağlantıları kabul edilir).
- Etkin bir kayıt varken aynı işlem yeniden algılanırsa yinelenen kayıt oluşturulmaz, mevcut kayıt güncellenir.
- 350 ms’lik sayfa yoklaması kaldırıldı; sayfa ve hesap değişimi DOM güncellemeleri ve `popstate` ile izlenir.
- Popup alt bilgisindeki sürüm `manifest.json`’dan okunur.

### Depo
- Kaynak dosyaları `src/`, belgeler `docs/` altına taşındı. `manifest.json` kökte kaldı; mevcut kurulumlar aynı klasörden **Yenile** ile güncellenebilir, kayıtlar korunur.

## 0.4.0 — 6 Eylül 2026

İlk GitHub sürümü.

- **X’e daha yakın görünüm:** Profilin yazı tipini kullanan düğmeler, ince kenarlık, hafif kırmızı/sarı vurgu ve sade kalem ikonu. Varsayılan koyu tema korundu (0.5.0’da “X ile aynı” oldu).
- **Önceki nedeni kullan:** Aynı hesabı yeniden engellediğinde veya sessize aldığında önceki aynı türdeki neden önerilir. Düğme bu nedeni düzenleyiciye getirir; **Kaydet** ile uygularsın. Yeni tweet bağlantısı korunur. Mevcut taslağın varsa önce o açılır; eski nedenle değiştirmek ayrıca senin seçimine bağlıdır.
- **Tweet bağlantısını düzenle:** Profil, önizleme ve Kayıtlar editöründe bağlantı ekleyebilir, değiştirebilir veya temizleyebilirsin. Farklı tweet bağlantısı kaydedildiğinde eski tweet metni kaldırılır; yeni tweet metni internetten indirilmez. Aynı tweetin takip parametreli bağlantısı metni silmez.
- **Kalıcı yerel taslak:** Profil/önizleme ve kayıt editöründe yazarken taslak bu tarayıcıya kaydedilir. X sekmesini yenileyince veya tarayıcıyı yeniden açınca düzenleyiciyi açarak devam edebilirsin. Popup’ta **Taslağa dön** görünür. Kaydedilmiş neden, **Kaydet** demeden değişmez. Kaydedince ilgili taslak temizlenir.
- **Klavye:** Not veya tweet alanındayken **Ctrl+Enter** (Mac: **Cmd+Enter**) kaydeder. **Esc** veya **Kapat**, taslağı koruyup editörü kapatır. X’in harf kısayolları yazı alanında çalışmaz; kopyalama/yapıştırma ve normal Enter ile satır ekleme korunur.
