# Chrome Web Store’da yayınlama

Mağaza: <https://chromewebstore.google.com/detail/enmdpnmbnmmlnfchlbolggldjnmbappb>

`main`’e her push CI’ı çalıştırır. Mağazaya yalnızca sürümü yükseltilmiş ve onaylanmış değişiklik gider.

## Yeni sürüm

1. `manifest.json` → `version` değerini yükselt (ör. `0.5.3`) ve `README.md` sürüm rozetini güncelle.
2. `CHANGELOG.md` en üstüne `## 0.5.3 — <tarih>` bölümünü ekle. Release notu bu bölümden alınır; bölüm yoksa yayın durur.
3. `main`’e push et.
4. Onay e-postasındaki linki aç (ya da [Actions → Release](https://github.com/isolmaz/WhyIBlockedX/actions/workflows/release.yml) → **Waiting** çalışma) → **Review deployments** → **chrome-web-store** → **Approve and deploy**. Göndermek istemiyorsan **Reject**; `main`’e sonraki push’ta yeniden sorulur.
5. **publish** işi bitince sürüm incelemededir ve GitHub’da `v0.5.3` release’i açılır.

## İnceleme

- İnceleme sürerken eski sürüm yayında kalır; geçince yeni sürüm kendiliğinden yayına girer.
- İnceleme bitmeden yeni sürüm gönderilemez.
- Reddedilirse: düzelt, sürümü yeniden yükselt, push et.

## Durum

| Ne | Nerede |
|---|---|
| Yayındaki sürüm | Mağaza sayfası → **Ayrıntılar → Sürüm** |
| İncelemedeki sürüm | [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Öğeler** |
| Gönderilen paketler | [GitHub Releases](https://github.com/isolmaz/WhyIBlockedX/releases) |
| Yayın çalışmaları | [Actions → Release](https://github.com/isolmaz/WhyIBlockedX/actions/workflows/release.yml) |

## Sorun giderme

| Hata | Çözüm |
|---|---|
| `CHANGELOG.md has no '## X ' section` | Bölümü ekle, push et. |
| `X is PENDING_REVIEW…` | İncelemenin bitmesini bekle ya da Dashboard’dan iptal et; sonra **Re-run**. |
| `invalid_grant`, `401`, `403` | Dashboard → **Ayarlar → Hizmet hesabı**’nda hesabın ekli ve anahtarın geçerli olduğunu kontrol et. |

## Anahtar

Secret’lar `chrome-web-store` ortamında (yalnızca `main`): `CWS_SERVICE_ACCOUNT_KEY`, `CWS_PUBLISHER_ID`. Anahtar Tonvela ile ortak.

Yenilemek için: Cloud Console → hizmet hesabı → **Keys → Add key → JSON**, sonra iki repoda da
`gh secret set CWS_SERVICE_ACCOUNT_KEY --env chrome-web-store -R isolmaz/<repo> < yeni.json`; ardından eski anahtarı ve JSON dosyasını sil.
