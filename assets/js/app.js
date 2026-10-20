(function () {
  "use strict";

  var $ = function (id) {
    return document.getElementById(id);
  };
  var urlEl = $("url");
  var hint = $("hint");
  var canvas = $("cv");
  var empty = $("empty");
  var statusEl = $("status");
  var buttons = [$("png"), $("svg"), $("copy")];
  var current = null;

  function normalize(raw) {
    var text = raw.trim();
    if (!text) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text;
    if (/\s/.test(text) || text.indexOf(".") < 0) return text;
    return "https://" + text;
  }

  function say(message) {
    statusEl.textContent = message;
    clearTimeout(say.timeout);
    say.timeout = setTimeout(function () {
      statusEl.textContent = "";
    }, 3500);
  }

  function setEnabled(enabled) {
    buttons.forEach(function (button) {
      button.disabled = !enabled;
    });
  }

  function build(text, correctionLevel) {
    var qr = window.qrcode(0, correctionLevel);
    qr.addData(text);
    qr.make();
    return qr;
  }

  function draw(qr, size, foreground, background) {
    var moduleCount = qr.getModuleCount();
    var margin = 4;
    var total = moduleCount + margin * 2;
    var scale = Math.max(1, Math.floor(size / total));
    canvas.width = canvas.height = scale * total;

    var context = canvas.getContext("2d");
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = foreground;

    for (var row = 0; row < moduleCount; row++) {
      for (var column = 0; column < moduleCount; column++) {
        if (qr.isDark(row, column)) {
          context.fillRect(
            (column + margin) * scale,
            (row + margin) * scale,
            scale,
            scale,
          );
        }
      }
    }
  }

  function svgString(qr, foreground, background) {
    var moduleCount = qr.getModuleCount();
    var margin = 4;
    var total = moduleCount + margin * 2;
    var path = "";

    for (var row = 0; row < moduleCount; row++) {
      for (var column = 0; column < moduleCount; column++) {
        if (qr.isDark(row, column)) {
          path +=
            "M" +
            (column + margin) +
            " " +
            (row + margin) +
            "h1v1h-1z";
        }
      }
    }

    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      total +
      " " +
      total +
      '" shape-rendering="crispEdges"><rect width="' +
      total +
      '" height="' +
      total +
      '" fill="' +
      background +
      '"/><path d="' +
      path +
      '" fill="' +
      foreground +
      '"/></svg>'
    );
  }

  function update() {
    var text = normalize(urlEl.value);
    hint.className = "hint";

    if (typeof window.qrcode !== "function") {
      current = null;
      canvas.hidden = true;
      empty.hidden = false;
      setEnabled(false);
      hint.className = "hint err";
      hint.textContent =
        "The local QR library is missing. See README.md to add it.";
      statusEl.textContent =
        "QR generation is unavailable until the local library is added.";
      return;
    }

    statusEl.textContent = "";
    if (!text) {
      current = null;
      canvas.hidden = true;
      empty.hidden = false;
      hint.textContent = "";
      setEnabled(false);
      return;
    }

    try {
      var qr = build(text, $("ec").value);
      current = { text: text, qr: qr };
      draw(
        qr,
        parseInt($("size").value, 10),
        $("fg").value,
        $("bg").value,
      );
      canvas.hidden = false;
      empty.hidden = true;
      hint.textContent = "Encoding: " + text;
      setEnabled(true);
    } catch (error) {
      current = null;
      canvas.hidden = true;
      empty.hidden = false;
      setEnabled(false);
      hint.className = "hint err";
      if (error && /length overflow/i.test(error.message)) {
        hint.textContent =
          "That link is too long for this error-correction level. Shorten it or choose Low.";
      } else {
        console.error("QR generation failed:", error);
        hint.textContent =
          "QR generation failed. See the browser console for details.";
      }
    }
  }

  function fileName(extension) {
    var base =
      current.text
        .replace(/^[a-z]+:\/\//i, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "link";
    return "qr-" + base + "." + extension;
  }

  function save(name, data) {
    var blob = data instanceof Blob ? data : new Blob([data]);
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 2000);
    say("Download started");
  }

  $("png").addEventListener("click", function () {
    if (!current) return;
    canvas.toBlob(function (blob) {
      if (blob) {
        save(fileName("png"), blob);
      } else {
        say("Couldn’t create the PNG. Try again.");
      }
    }, "image/png");
  });

  $("svg").addEventListener("click", function () {
    if (!current) return;
    save(
      fileName("svg"),
      svgString(current.qr, $("fg").value, $("bg").value),
    );
  });

  $("copy").addEventListener("click", function () {
    if (!current) return;
    canvas.toBlob(async function (blob) {
      if (!blob) {
        say("Couldn’t create the image. Try downloading the PNG.");
        return;
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        say("Image copied");
      } catch (error) {
        say("Copying isn’t allowed here. Use Download PNG.");
      }
    }, "image/png");
  });

  ["input", "change"].forEach(function (eventName) {
    ["url", "size", "ec", "fg", "bg"].forEach(function (id) {
      $(id).addEventListener(eventName, update);
    });
  });

  update();
})();
