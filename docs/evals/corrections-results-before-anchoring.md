# Correction-quality evaluation results

Generated 2026-09-13T20:00:56.969Z with chat model `gemini-3.6-flash`, embeddings `gemini-embedding-001` (768d), RAG_CORRECTIONS_MIN_SCORE = 0.65, 3 sample(s) per arm, judge = same chat model at temperature 0. Scores are judge means over the samples (individual samples in brackets).

| Case | Corrections retrieved | Baseline score | With correction |
|---|---|---|---|
| [Bookshop] Wrong book arrived in order 11902, it's not the title I ordered. What should I do? | 1 | 5.00 [5, 5, 5] | 5.00 [5, 5, 5] |
| [Bookshop] Package hasn't moved in over a week according to tracking, where is it? | 1 | 2.33 [2, 2, 3] | 4.67 [5, 4, 5] |
| [VPN SaaS] Can't connect to any German server, it just says connection failed. | 1 | 3.67 [4, 4, 3] | 4.67 [5, 5, 4] |
| [VPN SaaS] Payment for my plan bounced, the VPN stopped working. How do I fix it without losing my plan? | 1 | 2.00 [2, 2, 2] | 1.67 [1, 2, 2] |
| **Average** | | **3.25** | **4.00** |

## Details

### [Bookshop] Wrong book arrived in order 11902, it's not the title I ordered. What should I do?

**Baseline (5.00/5)** — The candidate reply follows all the key steps, commitments, and tone of the reference reply, including apologizing, asking to confirm the received vs ordered titles, promising an immediate reshipment of the correct book, and offering a prepaid return label.

> Hello [Name], I apologize that you received the wrong book in order 11902. Could you please confirm which title you received versus what you originally ordered? Once confirmed, I will ship the correct book out to you immediately and send a prepaid return label for the incorrect item. Thank you for your patience.

**With correction (5.00/5)** — The candidate reply captures all the key steps, commitments, and tone of the reference reply. It correctly apologizes, asks for verification of the received item versus the ordered item, promises immediate shipment of the correct book, and offers a prepaid return label.

> Hello [Name], I apologize that you received the wrong book for your order. Could you please confirm the title of the book you received versus the title on your original order? Once confirmed, I will arrange shipment of the correct book immediately and send you a prepaid return label for the incorrect item. Thank you for your patience.

### [Bookshop] Package hasn't moved in over a week according to tracking, where is it?

**Baseline (2.33/5)** — The candidate reply addresses the customer's delay and offers compensation, but it fails to follow the process set out in the reference: it does not open a trace with the courier, does not commit to a 24-hour follow-up, and omits the promise of a free replacement if the package is lost.

> Hello [Name], I am sorry your order has been delayed. I have checked with the courier and your package is now expected to arrive on [Date]. I have applied a 10% discount code to your account for the inconvenience. Please let me know if there is anything else I can assist you with.

**With correction (4.67/5)** — The candidate reply provides the exact same steps, commitments, and empathetic tone as the reference reply, with only very minor phrasing additions that do not alter the content or quality.

> Hello [Name], I am sorry your package has been delayed. I have opened a trace with the courier to locate your parcel and will have an updated delivery estimate for you within 24 hours. If the parcel cannot be located by then, I will send a replacement at no cost and we can discuss compensation for the inconvenience. I will update you by email tomorrow.

### [VPN SaaS] Can't connect to any German server, it just says connection failed.

**Baseline (3.67/5)** — The candidate reply follows the same helpful tone and includes most of the key troubleshooting steps (verifying active subscription, asking about protocol, suggesting protocol/server switches, and disabling firewall/antivirus). It only misses the specific isolation instruction of testing the Amsterdam server first and then switching protocols on Frankfurt.

> Hello [Name], I am sorry to hear you are having trouble connecting to our German servers. I have verified that your subscription is active. Which VPN protocol are you currently using? In the meantime, please try switching your protocol to WireGuard or OpenVPN, or try connecting to a different server location. Also, please temporarily disable any local firewall or antivirus software, reboot your device, and attempt to reconnect. Let me know the result so I can assist you further.

**With correction (4.67/5)** — The candidate reply includes all the key steps, commitments, and empathetic tone as the reference reply. It verifies the subscription status, asks about the protocol, provides actionable troubleshooting steps (changing location/protocol and checking firewall/antivirus), and offers to assist further once the customer replies.

> Hello [Name], I am sorry you are unable to connect to the German servers. I have verified that your subscription is active. Which VPN protocol (e.g., WireGuard or OpenVPN) are you using? In the meantime, please try switching to a server in another location or changing your protocol. Also, try temporarily disabling your local firewall or antivirus and rebooting your device. Let me know the result, and I will be happy to assist further.

### [VPN SaaS] Payment for my plan bounced, the VPN stopped working. How do I fix it without losing my plan?

**Baseline (2.00/5)** — The candidate reply acknowledges the issue politely but fails to provide any of the actionable steps or commitments present in the reference, such as updating payment details in the portal, retrying the payment, or offering manual processing to keep the current price.

> Hello, thank you for reaching out. I understand that your payment bounced and you want to ensure your plan remains intact. I am looking into this with our billing team and will update you as soon as possible.

**With correction (1.67/5)** — The candidate reply fails to provide any of the actionable steps or commitments present in the reference. It only states that the team is looking into the issue, rather than explaining how the customer can update their payment details or offering to process the payment manually.

> Hello [Name], thank you for reaching out. I understand your payment failed and your VPN service was interrupted. I am currently looking into your account with our team to help you resolve this issue. I will update you as soon as possible.
