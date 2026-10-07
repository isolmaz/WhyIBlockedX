# Chrome Web Store’da yayınlama

WhyIBlockedX mağazada: <https://chromewebstore.google.com/detail/enmdpnmbnmmlnfchlbolggldjnmbappb>

Hiçbir değişiklik onay vermeden mağazaya gitmez:

| `main`’e gelen değişiklik | Ne olur |
|---|---|
| Sürüm (`manifest.json` → `version`) aynı | Yalnızca CI çalışır. Mağazaya bir şey gönderilmez. |
| Sürüm yükselmiş, GitHub’da `v<sürüm>` release’i yok | CI geçerse yayın işi **onay bekler**. Onaylarsan paket mağazaya yüklenir, incelemeye gönderilir ve `v<sürüm>` release’i açılır. Reddedersen hiçbir şey yüklenmez. |

Google incelemesi geçince sürüm kendiliğinden yayına girer. İnceleme birkaç saat ile birkaç gün sürebilir.

## Durum nereden görülür

| Ne | Nerede |
|---|---|
| Kullanıcıların aldığı sürüm | Mağaza sayfası → **Ayrıntılar → Sürüm** |
| İncelemedeki sürüm | [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Öğeler → WhyIBlockedX** |
| Mağazaya gönderilmiş sürümler | [GitHub Releases](https://github.com/isolmaz/WhyIBlockedX/releases): her `v<sürüm>` mağazaya gönderilmiş paketin aynısıdır |
| Onay bekleyen veya son yayın denemesi | [Actions → Release](https://github.com/isolmaz/WhyIBlockedX/actions/workflows/release.yml): **Chrome Web Store** adımı mağazadaki ve incelemedeki sürümü yazar |

## Yeni sürüm çıkarmak

1. Değişiklikleri `main`’e al (PR ya da doğrudan push).
2. `manifest.json` içindeki `version` değerini yükselt (ör. `0.5.2` → `0.5.3`) ve `README.md` sürüm rozetini güncelle.
3. `CHANGELOG.md` en üstüne `## 0.5.3 — 8 Ekim 2026` biçiminde bir bölüm yaz. Bu bölüm release notu olur; yoksa yayın durur.
4. Commit’le (`WhyIBlockedX 0.5.3`) ve `main`’e push et.
5. GitHub onay ister: e-posta ya da bildirim gelir, Actions’ta çalışma **Waiting** görünür. **Review deployments** → `chrome-web-store` → **Approve and deploy**.
   - Henüz yayınlamak istemiyorsan **Reject** de. Bu sürüm gönderilmez; `main`’e bir sonraki push’ta yeniden sorulur.
6. İş bitince **Chrome Web Store** adımında `Submitted 0.5.3 for review: PENDING_REVIEW` görünür.

Yayını yeniden denemek için: Actions → **Release** → **Run workflow** (`main`). Bu da onay ister. Sürüm zaten yayındaysa ya da incelemedeyse paket tekrar yüklenmez, yalnızca eksik GitHub release’i açılır.

## Sorun giderme

| Hata | Çözüm |
|---|---|
| `CHANGELOG.md has no '## X ' section` | `## X — tarih` bölümünü ekle, push et. |
| `X is PENDING_REVIEW; wait for it or cancel it…` | Önceki sürüm hâlâ incelemede. Bitmesini bekle ya da Dashboard’dan gönderimi iptal et; sonra çalışmayı **Re-run** et. |
| `invalid_grant`, `401` veya `403` | Dashboard → **Ayarlar → Hizmet hesabı** altında `github-publisher@cws-publish-510912.iam.gserviceaccount.com` ekli mi, anahtar silinmiş mi kontrol et. |
| Mağaza sürümü reddediyor (sürüm küçük/aynı) | `manifest.json` sürümünü mağazadakinden büyük yap. |

## Kurulum (bir kez yapıldı)

- Google Cloud projesi `cws-publish-510912`: Chrome Web Store API açık, `github-publisher` hizmet hesabı (rol yok).
- Developer Dashboard → **Ayarlar → Hizmet hesabı**: yukarıdaki e-posta ekli.
- GitHub → **Settings → Environments → `chrome-web-store`**: yalnızca `main` dalı, onaylayan `isolmaz`. Secret’lar: `CWS_SERVICE_ACCOUNT_KEY` (hizmet hesabının JSON anahtarı) ve `CWS_PUBLISHER_ID`.
- Anahtarı yenilemek: Cloud Console → hizmet hesabı → **Keys → Add key → JSON**, ardından
  `gh secret set CWS_SERVICE_ACCOUNT_KEY --env chrome-web-store -R isolmaz/WhyIBlockedX < yeni.json`.
  Aynı anahtarı Tonvela da kullanıyor; orada da güncelle. Sonra eski anahtarı Cloud Console’dan, JSON dosyasını bilgisayarından sil.
