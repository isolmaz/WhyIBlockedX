# Kurulum ve kullanım kılavuzu

Chrome veya Edge masaüstü, sürüm 127 ya da sonrası. Türkçe ve İngilizce X web arayüzü için. Eklentinin arayüzü İngilizce ve Türkçe’dir; tarayıcı dilini izler.

## İlk kurulum

1. Depoyu klonla ya da GitHub'da **Code → Download ZIP** ile indirip kalıcı bir klasöre çıkar:
   ```sh
   git clone https://github.com/isolmaz/WhyIBlockedX.git
   ```
2. `chrome://extensions` (Edge: `edge://extensions`) sayfasında **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle** ile `manifest.json` dosyasının bulunduğu klasörü (deponun kökü) seç.
4. Açık X sekmelerini yenile ve eklentiyi araç çubuğuna sabitle.

## Güncelleme

1. Önce eklentiden **Yedekleme → Yedek indir**.
2. Aynı klasörü güncelle: `git pull` ya da yeni ZIP'in içeriğini eski klasörün üzerine kopyala.
3. Eklentiyi kaldırma; eklentiler sayfasında **Yenile** düğmesine bas.
4. Açık X sekmelerini yenile.

Paketlenmemiş eklentinin kimliği klasör yoluna bağlıdır. **Aynı klasörü kullanmak kimliği ve kayıtları korur.** Farklı bir klasörden yüklersen boş bir eklenti açılır; yedeğini **Yedekleme → Yedekten yükle** ile geri aktarabilirsin. Eski “Neden” sürümünden gelen kurulumlar için de aynı yol geçerlidir.

## İşlem akışları

- **Engelle, engellemeyi kaldır, sessize al, sessize almayı kaldır** desteklenen menülerde aynı tek tıklama akışını kullanır. X’in var olan seçenekleri aynı yerde tutulup işlem akışı devralınır; aynı türdeki mevcut profil düğmesinin yanına ikinci bir düğme eklenmez.
- Tam profilde ve desteklenen profil önizlemesinde hızlı işlem düğmeleri bulunur. Hedefin durumu işlem sırasında X’in güncel menüsünden seçilir. Sessize alma durumu henüz bilinmiyorsa düğme “Sessize al / kaldır” yazar; önceki kayıt durum olarak varsayılmaz.
- Desteklenen onaylar arka planda tamamlanır; ayrı not penceresi açılmaz. Düğmeye basmak X’te gerçek işlem yapar. Bir adım veya yanıt doğrulanamazsa hata görünür. Farklı bir hesap/işlem onayı otomatik onaylanmaz.
- **Geri al**, erişilebilir aynı menü üzerinden ters X işlemini uygular. Menü hâlâ mevcutsa kısa süre gösterilir. Her doğrudan liste düğmesinde geri alma menüsü bulunmayabilir.
- Engel veya sessize alma kaldırıldığında neden ve tweet silinmez. Kayıtlar ekranında “Kaldırıldı” olarak geçmişte kalır.
- Profilde ince kırmızı engelleme / sarı sessize alma vurgusu, neden ve tweeti belirgin gösterir. Kalem veya **Neden ekle** ile aynı yerde düzenle.
- **Tweetin tamamını göster / Daralt** kayıtlı metni aynı alanda açar ve kapatır. “Asıl tweeti aç” bağlantısı X’e gider.
- Neden yazarken X’in harf kısayolları engellenir. Metin seçme, kopyalama/yapıştırma ve Türkçe karakterler desteklenir. Alanın dışına çıkınca X kısayolları yeniden çalışır.

## Neden düzenleme ve taslaklar

- Profilde veya profil önizlemesinde kalem simgesine ya da **Neden ekle**’ye bas; neden ve ilgili tweet bağlantısı aynı yerde düzenlenir.
- Yazarken taslak bu tarayıcıya kaydedilir. Sekmeyi yenileyince ya da tarayıcıyı yeniden açınca düzenleyiciyi açıp devam edebilirsin. Kaydedilmiş neden, **Kaydet** demeden değişmez.
- **Ctrl+Enter** (Mac: **Cmd+Enter**) kaydeder. **Esc** veya **Kapat**, taslağı koruyup düzenleyiciyi kapatır.
- Aynı hesabı yeniden engellediğinde veya sessize aldığında **Önceki nedeni kullan** eski nedeni düzenleyiciye getirir.
- Farklı bir tweet bağlantısı kaydedilince eski tweet metni kaldırılır; yeni metin internetten indirilmez.

## Tek popup içinde

İkona tıklayınca **Kayıtlar, Ayarlar, Yedekleme** açılır. Alt sayfalar aynı popup içinde kalır; **← Geri** ile dönülür. Accordion veya eklenti için yeni tarayıcı sekmesi yoktur. Arama, not taslağı ve sayfa konumu geri gezinmede korunur. Kayıt düzenleme taslakları tarayıcı yeniden başlatılınca da geri gelir. Elle yeni kayıt formundaki tamamlanmamış bilgiler aynı tarayıcı oturumu boyunca korunur.

**Ayarlar → Düğmeler ve işlem akışları:** Tam profil, profil önizlemesi, tweet menüsü ve hesap listeleri ayrı ayrı açılıp kapatılır. Kapalı yerde ek düğmeler gizlenir ve X’in kendi akışı çalışır. Desteklenen başarılı işlemler yine kaydedilebilir.

**Ayarlar → Görünüm:** Dil (Tarayıcı dili / English / Türkçe), neden/tweet/tarih görünürlüğü, iki satır/tam metin ve Siyah / Gece mavisi / X ile aynı temaları. Varsayılan “X ile aynı”dır: X’in arka planını (Varsayılan / Loş / Işıklar kapalı) ve seçtiğin vurgu rengini izler. 0.4.x’ten güncellenen ve siyahta kalan kurulumlar bir kez “X ile aynı”ya geçirilir.

**Tweeti otomatik kaydet:** Yeni işlemlerde görünen metin ve tweet bağlantısını saklar. Kapatmak eski tweetleri silmez. Profil menüsünde tweet bağlamı yoksa tweet eklenmez.

**Kayıtlar:** Arama, engelleme/sessize alma filtresi, neden ve tweet bağlantısı düzenleme, yerel silme ve elle kayıt ekleme. Elle kayıt eklemek X’te engelleme yapmaz.

## Kayıtlar ve kaldırma uyarısı

Tüm kayıtlar ve düzenleme taslakları yalnızca eklentinin `chrome.storage.local` alanındadır. Tek izin `storage` iznidir. Bulut, ek Windows programı, arka planda harici dosyaya kopyalama, hesap girişi veya sunucu yoktur.

**Eklentiyi kaldırırsan kayıtların silinir. Önce yedek indir.** Bu uyarı ayarlarda ve yedekleme ekranında görünür. Tarayıcının kendi kaldırma penceresine eklenti özel uyarı ekleyemez. Yeniden yükleme sonrası otomatik geri getirme yoktur.

**Yedek indir**, kullanıcının isteğiyle kaydedilmiş kayıtları JSON olarak indirir. Tamamlanmamış taslaklar yedeğe dahil değildir; yedek almadan önce korumak istediğin taslağı kaydet. **Yedekten yükle**, Neden ve WhyIBlockedX 1/2/3 yedeklerini kontrol edip birleştirir. Mevcut notlar korunur, tekrarlanan kayıtlar atlanır. Ayarlar yedekte bulunur ama içe aktarma mevcut ayarlarını değiştirmez.

**Tüm kayıtları sil**, popup içindeki onay ekranından sonra yerel kayıtları ve taslakları siler. X hesabındaki engelleri/sessize almaları veya eklenti ayarlarını değiştirmez.

## Doğrulama ve sınırlar

Bu sürüm gerçek Chromium tarayıcısında taklit X sayfaları ve yanıtlarıyla test edildi; oturum açılmış gerçek X hesabında canlı işlem testi yapılmadı. X’in arayüzü, menüleri veya özel web uçları değişirse bazı yerlerde algılama/yerleşim çalışmayabilir. Tanınmayan seçeneklerin kontrolü X’te kalır. Kapsam masaüstü X web arayüzüdür; mobil uygulama değildir.

Önceki engel listesi otomatik indirilmez. Eski engellenen profilde neden elle eklenebilir. Hesaplar kullanıcı adıyla eşleştirilir; kullanıcı adı değişiklikleri takip edilmez. Aktif hesap adı bilinen kayıtlar farklı aktif X hesabının profil alanında gösterilmez; sahibi belirtilmeyen elle/eski kayıtlar ortak sayılır. Kayıtlar listesi bu tarayıcıdaki bütün yerel kayıtları içerir.

Tweetin yalnızca o anda görünen metni saklanır; medya veya açılmamış uzun metin indirilmez. “Tamamını göster”, saklanan metnin tamamını gösterir; hiç yakalanmamış metni geri getiremez. Analitik, uzaktan kod, parola/çerez/yetkilendirme başlığı kaydı yoktur.

X ile bağlantılı resmî bir ürün değildir. [MIT lisansı](../LICENSE) ile dağıtılır. Gizlilik politikası: [PRIVACY.md](../PRIVACY.md).

## Kaynaklar

- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- https://developer.chrome.com/docs/extensions/reference/api/action
