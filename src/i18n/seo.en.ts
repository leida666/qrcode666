/** Copy for the per-type landing pages and the guides (English). */

interface TypePage {
  /** Short label for link lists. */
  nav: string
  /** "a Wi-Fi QR code" — used in "How to make …". */
  name: string
  title: string
  description: string
  h1: string
  subtitle: string
  steps: string[]
  faq: { q: string; a: string }[]
}

interface Article {
  nav: string
  title: string
  description: string
  h1: string
  lead: string
  sections: { h: string; p: string[] }[]
  cta: string
}

const types: Record<
  'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'location' | 'event',
  TypePage
> = {
  url: {
    nav: 'URL / link QR code',
    name: 'a URL QR code',
    title: 'Free URL QR Code Generator — No Redirect, No Expiry | QRCode666',
    description:
      'Turn any link into a permanent QR code. The web address is stored directly in the code — no short link, no sign-up, no expiry. Download PNG or SVG free.',
    h1: 'URL QR Code Generator',
    subtitle:
      'Paste a link, get a QR code that opens it — for as long as your page exists. The address is written straight into the code, not hidden behind someone else’s short link.',
    steps: [
      'Paste your website address.',
      'Pick a style, or keep it classic black on white.',
      'Download as PNG or SVG, and test-scan it before you print.',
    ],
    faq: [
      {
        q: 'Will the QR code keep working if I change my website?',
        a: 'It always opens exactly the address it contains. If you move or delete that page, the code leads to whatever is there now — so encode an address you control and keep it alive, or redirect it on your own site.',
      },
      {
        q: 'Can I see how many people scan it?',
        a: 'Not through us — we are never in the middle. Add UTM parameters to your link (for example ?utm_source=qr&utm_medium=print) and scans show up as visits in your own analytics.',
      },
      {
        q: 'Why not use a short link instead?',
        a: 'A short link adds a company you depend on. If that service shuts down or starts charging, every printed code breaks. A direct URL depends only on your own website.',
      },
    ],
  },
  text: {
    nav: 'Text QR code',
    name: 'a text QR code',
    title: 'Free Text QR Code Generator — Any Language, Works Offline | QRCode666',
    description:
      'Encode any text — notes, serial numbers, messages, Chinese or emoji — in a QR code that scans without internet. Free, no sign-up, made in your browser.',
    h1: 'Text QR Code Generator',
    subtitle:
      'Put a message, a code or instructions into a QR code. Phones read the text straight from the image — no internet connection needed to scan it.',
    steps: ['Type or paste your text.', 'Choose a style and size.', 'Download and test-scan.'],
    faq: [
      {
        q: 'How much text fits in a QR code?',
        a: 'Up to 2,953 bytes at the lowest error-correction level — about 2,900 English characters or roughly 980 Chinese characters. Shorter text makes a simpler code that scans more easily.',
      },
      {
        q: 'Does scanning a text QR code need the internet?',
        a: 'No. The text is inside the code itself, so the phone shows it without going online.',
      },
      {
        q: 'Are Chinese characters and emoji supported?',
        a: 'Yes. Text is encoded as UTF-8, which every modern phone reads.',
      },
    ],
  },
  wifi: {
    nav: 'Wi-Fi QR code',
    name: 'a Wi-Fi QR code',
    title: 'Free Wi-Fi QR Code Generator — Share Your Wi-Fi Password | QRCode666',
    description:
      'Create a Wi-Fi QR code so guests join your network with one scan. Works with iPhone and Android cameras. Free, private, generated in your browser.',
    h1: 'Wi-Fi QR Code Generator',
    subtitle:
      'Guests point their camera, tap, and they’re online. No more spelling out passwords — and your password never leaves your device while you make the code.',
    steps: [
      'Enter the network name (SSID) and password.',
      'Pick the security type — most networks are WPA/WPA2/WPA3.',
      'Print it and put it where guests can see it.',
    ],
    faq: [
      {
        q: 'Which phones can scan a Wi-Fi QR code?',
        a: 'iPhones running iOS 11 or later and Android phones running Android 10 or later can join straight from the camera; many older Android phones can via Google Lens.',
      },
      {
        q: 'Is it safe to share Wi-Fi this way?',
        a: 'The password is stored as plain text inside the code, so anyone who scans it can read it. Use it for networks you’d share anyway, such as a guest network.',
      },
      {
        q: 'What happens if I change the password?',
        a: 'The old password is printed in the code, so it stops connecting. Make a new code after changing it.',
      },
    ],
  },
  email: {
    nav: 'Email QR code',
    name: 'an email QR code',
    title: 'Free Email QR Code Generator — Pre-filled Emails | QRCode666',
    description:
      'Make a QR code that opens a new email with the address, subject and message already filled in. Free, permanent, no sign-up.',
    h1: 'Email QR Code Generator',
    subtitle: 'One scan opens the phone’s mail app with everything filled in — handy for feedback, support and sign-up requests.',
    steps: ['Enter the email address.', 'Optionally add a subject and a message.', 'Download, print and test-scan.'],
    faq: [
      {
        q: 'Does the email send automatically?',
        a: 'No. The mail app opens with a draft; the person still taps Send.',
      },
      {
        q: 'Which email apps work?',
        a: 'Any app that handles mailto: links — Apple Mail, Gmail, Outlook and others.',
      },
    ],
  },
  phone: {
    nav: 'Phone number QR code',
    name: 'a phone number QR code',
    title: 'Free Phone Number QR Code Generator — Tap to Call | QRCode666',
    description: 'Create a QR code that dials your phone number when scanned. Free, permanent and generated in your browser.',
    h1: 'Phone Number QR Code Generator',
    subtitle: 'Scan, tap, call. Great for shop windows, flyers and vehicles.',
    steps: [
      'Enter the number with its country code (for example +1 or +86).',
      'Style it to match your print.',
      'Download and test-scan.',
    ],
    faq: [
      {
        q: 'Should I include the country code?',
        a: 'Yes. With a leading + and the country code, the number works for anyone, wherever they scan it.',
      },
      {
        q: 'Does it call automatically?',
        a: 'No. The phone shows the number and the person confirms the call.',
      },
    ],
  },
  sms: {
    nav: 'SMS QR code',
    name: 'an SMS QR code',
    title: 'Free SMS QR Code Generator — Pre-filled Text Messages | QRCode666',
    description:
      'Make a QR code that opens a text message to your number with the message already written. Free, permanent, no sign-up.',
    h1: 'SMS QR Code Generator',
    subtitle: 'Let people text you a keyword, an order or an RSVP with one scan.',
    steps: [
      'Enter the phone number.',
      'Write the message to pre-fill (optional).',
      'Download and test-scan on both iPhone and Android.',
    ],
    faq: [
      {
        q: 'Is the message sent automatically?',
        a: 'No. The messaging app opens with the text filled in and the person taps Send. Their normal SMS rates apply.',
      },
      {
        q: 'Which format do you use?',
        a: 'The widely supported SMSTO:number:message format, read by the iPhone camera, Android scanners and Google Lens.',
      },
    ],
  },
  vcard: {
    nav: 'vCard / contact QR code',
    name: 'a vCard QR code',
    title: 'Free vCard QR Code Generator — Digital Business Card, No Subscription | QRCode666',
    description:
      'Put your contact details on a QR code. One scan saves your name, phone, email and address to the phone’s contacts. Free, no subscription, no expiry.',
    h1: 'vCard QR Code Generator',
    subtitle:
      'A business card that types itself into people’s phones. Your details live in the code — not on a profile page someone else hosts and can switch off.',
    steps: [
      'Fill in the details you want to share.',
      'Keep it short: fewer fields make a simpler code that scans more easily.',
      'Print it on your card, badge or flyer.',
    ],
    faq: [
      {
        q: 'How is this different from a “digital business card” service?',
        a: 'Those usually encode a link to a profile page on their servers, which stops working if you stop paying. A vCard code contains the contact itself and works offline, for good.',
      },
      {
        q: 'Can I update my details later?',
        a: 'Not in an existing code. Generate a new one when your details change.',
      },
      {
        q: 'Which vCard version do you use?',
        a: 'vCard 3.0, which both iPhone and Android contacts import.',
      },
    ],
  },
  location: {
    nav: 'Location QR code',
    name: 'a location QR code',
    title: 'Free Location QR Code Generator — Open a Map Pin | QRCode666',
    description:
      'Create a QR code that opens a place on the map from its coordinates. Choose a standard geo: link or a Google Maps link. Free and permanent.',
    h1: 'Location QR Code Generator',
    subtitle: 'Point people to an entrance, a meeting spot or a trailhead — exactly, with coordinates.',
    steps: [
      'Enter the latitude and longitude (copy them from any map app).',
      'Choose a geo: link or a Google Maps link.',
      'Download and test-scan.',
    ],
    faq: [
      {
        q: 'geo: or Google Maps — which should I use?',
        a: 'geo: is an open standard that opens the phone’s default map app and doesn’t depend on any company. A Google Maps link works on more devices but relies on Google.',
      },
      {
        q: 'How do I find the coordinates?',
        a: 'In Google Maps, press and hold a spot to see them. In Apple Maps, drop a pin and swipe up on its card.',
      },
    ],
  },
  event: {
    nav: 'Calendar event QR code',
    name: 'a calendar event QR code',
    title: 'Free Calendar Event QR Code Generator — Add to Calendar | QRCode666',
    description:
      'Make a QR code that adds your event — title, time and place — to the scanner’s calendar. Free, permanent, generated in your browser.',
    h1: 'Calendar Event QR Code Generator',
    subtitle: 'Put it on the poster and let people save the date with one scan.',
    steps: ['Enter the event name and its start and end time.', 'Add a location and description if you like.', 'Download and test-scan.'],
    faq: [
      {
        q: 'Which time zone is used?',
        a: 'You enter your local time and we store it in UTC, so every phone shows it correctly in its own time zone.',
      },
      {
        q: 'Do all phones support event QR codes?',
        a: 'Support varies between scanner apps, so always test-scan with the kinds of phones your audience uses. If in doubt, a URL code pointing to an event page works everywhere.',
      },
    ],
  },
}

const articles: Record<'expire' | 'stopped', Article> = {
  expire: {
    nav: 'Do QR codes expire?',
    title: 'Do QR Codes Expire? The Honest Answer | QRCode666',
    description:
      'QR codes themselves never expire. Codes that “expire” are dynamic codes whose redirect was switched off. Here’s how to tell the difference and make codes that last.',
    h1: 'Do QR codes expire?',
    lead: 'Short answer: no. A QR code is a pattern that stores data — there’s nothing inside it that can run out. But some QR codes do stop working, and it’s worth knowing why before you print 5,000 menus.',
    sections: [
      {
        h: 'A QR code is just data',
        p: [
          'Every QR code is a grid of squares that encodes text: a web address, a Wi-Fi password, a contact card. Your phone reads that text directly from the image. No server is involved and there is no date inside. A static QR code printed in 2010 still scans today.',
        ],
      },
      {
        h: 'So why do some QR codes “expire”?',
        p: [
          'Many QR code services make dynamic codes by default. Instead of your web address, the code contains a short link to the provider’s server, which then redirects to your page. That lets them offer editing and scan statistics — and it means the code only works while their server keeps redirecting it.',
          'When a subscription lapses, a trial ends or the company closes, the redirect stops. The printed code still scans, but it lands on an error page, an upgrade prompt, or nowhere at all.',
        ],
      },
      {
        h: 'How to tell which kind you have',
        p: [
          'Scan the code and look at the address before you open it. If it shows your own domain (yourbrand.com/menu), it’s static. If it shows the QR provider’s domain or a short link you don’t recognise, it’s dynamic — and it depends on them.',
        ],
      },
      {
        h: 'How to make a QR code that lasts',
        p: [
          'Use a static code that contains your real address. Better still, use an address on a domain you own: then you can change what that page shows, or redirect it, without reprinting anything and without paying a QR company.',
          'Every code made on QRCode666 is static. It will never expire because of us.',
        ],
      },
    ],
    cta: 'Make a permanent QR code',
  },
  stopped: {
    nav: 'My QR code stopped working',
    title: 'QR Code Stopped Working? Why It Happens and How to Fix It | QRCode666',
    description:
      'If a printed QR code suddenly stopped working, it was probably a dynamic code whose subscription ended. How to check, what you can do, and how to avoid it next time.',
    h1: 'My QR code stopped working. Why?',
    lead: 'If a code that used to work now shows an error, an “upgrade” page or a dead link, the printed code itself is almost never the problem. Here’s how to find the real cause and get things working again.',
    sections: [
      {
        h: '1. Check where it points',
        p: ['Scan it with your phone camera and read the address shown before opening it. That tells you who controls where the code goes.'],
      },
      {
        h: '2. If it points to a QR service’s domain',
        p: [
          'It’s a dynamic code. Its destination is stored on that company’s server, and the redirect has been switched off — often because a free trial or subscription ended. Your options: renew with that company, or replace the code with a static one that points straight to your page.',
        ],
      },
      {
        h: '3. If it points to your own website',
        p: [
          'The code is fine; the page isn’t. Check whether the page was moved or deleted, or the domain expired. Fix the page — or redirect the old address — and every printed copy works again.',
        ],
      },
      {
        h: '4. If it doesn’t scan at all',
        p: [
          'Damage, glare, low contrast, a tiny print size or a logo covering too much can make a code unreadable. Print it larger, with dark squares on a light background and a clear margin around it.',
        ],
      },
      {
        h: 'How to avoid this next time',
        p: [
          'Use a static QR code that contains your real address — ideally on a domain you own — so nothing between the code and your content can be switched off. That’s the only kind of code QRCode666 makes, for free, without an account.',
        ],
      },
    ],
    cta: 'Make a replacement QR code',
  },
}

export const seoEn = {
  ui: {
    home: 'Home',
    breadcrumb: 'Breadcrumb',
    generators: 'Free QR code generators',
    guides: 'Guides',
    howTitle: (name: string) => `How to make ${name}`,
    faqTitle: 'Common questions',
    related: 'Keep reading',
    allTypes: 'All types on one page',
  },
  types,
  articles,
}

export type SeoDict = typeof seoEn
