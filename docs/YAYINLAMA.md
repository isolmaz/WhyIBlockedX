# GitHub’da yayınlama

Sürümler [GitHub Releases](https://github.com/isolmaz/WhyIBlockedX/releases)’te yayımlanır. Eklenti Chrome Web Store’da değildir.

`main`’e her push CI’ı çalıştırır. Release yalnızca sürümü yükseltilmiş değişiklik için açılır.

## Yeni sürüm

1. `manifest.json` → `version` değerini yükselt (ör. `0.6.1`) ve `README.md` sürüm rozetini güncelle.
2. `CHANGELOG.md` en üstüne `## 0.6.1 — <tarih>` bölümünü ekle. Release notu bu bölümden alınır; bölüm yoksa yayın durur.
3. `main`’e push et (ya da PR’ı merge et).
4. [Actions → Release](https://github.com/isolmaz/WhyIBlockedX/actions/workflows/release.yml) CI’ı çalıştırır, `WhyIBlockedX-v0.6.1.zip` paketini oluşturur ve `v0.6.1` release’ini açar. Onay adımı yoktur.

Aynı sürüm için release zaten varsa **publish** işi atlanır; yeni release için sürümü yükselt.

## Sorun giderme

| Hata | Çözüm |
|---|---|
| `CHANGELOG.md has no '## X ' section` | Bölümü ekle, push et. |
| `v0.6.1 is already released` | `manifest.json` sürümünü yükselt. |
