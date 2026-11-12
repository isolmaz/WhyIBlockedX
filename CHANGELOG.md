# Değişiklik günlüğü

## 0.7.0 — 12 Kasım 2026

### Yeni
- **Gönderinin ⋯ menüsünde kırmızı Toplu engelle.** Her gönderide **Toplu engelle: repost edenler**, kendi gönderilerinde ayrıca **Toplu engelle: beğenenler** çıkar. X beğenenleri yalnız gönderinin sahibine gösterdiği için başkasının gönderisinde beğenenler engellenemez.
- Toplu engelleme repost edenler sayfasında da çalışır; popup’taki **Toplu engelle** artık repost edenler sayfasını açar.
- Menülerde X’in kendi **Engelle** seçeneği kırmızı görünür.

## 0.6.0 — 12 Kasım 2026

### Yeni
- **Bir gönderiyi beğenenleri topluca engelle.** Popup ana sayfasında **Toplu engelle** → gönderi bağlantısını yapıştır → **Beğenenler sayfasını aç**. Panel, beğenen listesinin tamamını X’in kendi oturumundaki isteklerle (yalnız bellekte) yükler, **kesin sayıyı** gösterir ve onay ister. Onaydan sonra engellemeler X’in kendi block isteğiyle **paralel** yürür; 1000 kişilik liste tek tek UI tıklaması beklemez. Liste tamamen yüklenemezse yalnız sayfada görünen hesaplar onaylatılır. Hızlı yol kullanılamazsa tek tek arayüz akışına düşer ve yalnız onaylanan kümede olup sayfada görünen hesapları engeller. **Durdur** ile akış istenen anda kesilir.
- Kendi hesabın her zaman atlanır; tek tek arayüz akışı zaten “engeli kaldır” gösterenleri de atlar. Hızlı yol zaten engellenmiş bir hesaba yeniden istek gönderebilir, yinelenen kayıt açılmaz. X üst üste hata verirse veya sayfa/hesap değişirse akış durur; hız sınırına takılırsa kalanlar durdurulur.
- Engellenen her hesap için mevcut geçmişe normal bir yerel kayıt eklenir: kullanıcı adı, X döndürdüyse görünen ad, engelleme işlemi, gönderi bağlantısı ve boş neden. Neden uydurulmaz; beğenen listesi veya istek bilgisi saklanmaz. Yetkilendirme başlıkları yalnız bellekte, başka sayfaya geçene kadar tutulur; depoya yazılmaz. Yeni izin, sunucu, eşitleme veya analitik yok.

### Depo
- Eklenti Chrome Web Store’da değil. Yükseltilen sürüm `main`’e gelince ZIP paketi otomatik olarak GitHub Releases’te yayımlanır; kurulum ve güncelleme bu paketle yapılır (`docs/YAYINLAMA.md`, `docs/KURULUM.md`).

## 0.5.2 — 7 Ekim 2026

### Düzeltmeler
- Engelle, sessize al veya geri al başlatılamadığında (önceki işlem sürüyor, hedef hesap bulunamadı, profil güncelleniyor ya da açık bir onay penceresi var) tıklama sessizce yutuluyordu; nedeni artık bildirimde görünür.
- Arka plan geç yanıt verdiğinde profil veya önizleme notu iki kez eklenebiliyordu; panel güncellemeleri artık sırayla çalışır.
- Popup Kayıtlar gibi bir alt sayfadayken kapatılıp yeniden açılınca geri düğmesi kayboluyor, ana sayfaya dönülemiyordu.

### Depo
- `main`’e gelen her değişiklik CI’dan geçer. Yükseltilen sürüm, GitHub Actions’ta onaylanınca Chrome Web Store’a yüklenip incelemeye gönderilir ve GitHub’da yayımlanır (`docs/YAYINLAMA.md`).
- README ve kurulum kılavuzu Chrome Web Store sayfasına bağlanır; mağaza ve kaynaktan kurulum arasında yedekle geçiş anlatılır.

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
