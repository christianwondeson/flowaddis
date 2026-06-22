export const bookingFlowAm = {
    bookingFlow: {
        successTitle: 'መያዣዎ ተረጋገጠ!',
        successThankYou:
            'ለቡክአዲስ እናመሰግናለን። ክፍያዎ ተቀብሏል እና መያዣዎ ደህንነቱ ተጠብቋል።',
        pendingTitle: 'በስልክዎ ክፍያውን ያጠናቅቁ',
        pendingBody:
            'CBE Birr USSD ጥያቄ ወደ ስልክዎ ተላክቷል። PIN ያስገቡ። ክፍያ ሲደርስ ገጹ በ自动 ይሻሻላል።',
        pendingAmount: 'ለማረጋገጥ መጠን፦ {amount}',
        failedTitle: 'ክፍያ አልተሳካም',
        failedBody:
            'CBE Birr ክፍያ አልተጠናቀቀም። ከመያዣዎ እንደገና መሞክር ወይም የክፍያ ማጣቀሻዎን በመጠቀም ድጋፍ ያግኙ።',
        expiredTitle: 'የክፍያ ጊዜ ገደቡ አልፏል',
        expiredBody: 'ይህ የክፍያ ጥያቄ ጊዜው አልፏል። አዲስ USSD ጥያቄ ለማግኘት እንደገና ይጀምሩ።',
        eticketLabel: 'ኢ-ትኬት ተላከ',
        eticketHint: 'ዝርዝሮች ለመመልከት ኢሜይልዎን ይመልከቱ',
        eticketPendingHint: 'ክፍያ ከተሳካ በኋላ የማረጋገጫ ኢሜይል ይላካል',
        bookingIdLabel: 'የክፍያ ማጣቀሻ',
        bookingIdFallback: 'ተካትቷል',
        bookingIdHint: 'ለድጋፍ እና የባንክ ማጣራት ይህን ማጣቀሻ ያስቀምጡ',
        backToBookAddis: 'ወደ ቡክአዲስ ተመለስ',
        stayOnBookAddis: 'በቡክአዲስ ይቆዩ',
        viewBookingDetails: 'የመያዣ ዝርዝር ይመልከቱ',
        cancelTitle: 'መያዣ ተሰርዟል',
        cancelBody:
            'ክፍያ አልተጠናቀቀም እና መያዣው ተሰርዟል። ካርድዎ ላይ ክፍያ አልተደረገም።',
        cancelBankHint:
            '"ባንክ ተከፍሎኛል በዚህ ገጽ እመለከታለሁ" — አትጨነቁ፣ በመጠባበቅ ላይ ያለ ማረጋገጫ በቀን አልፎ ይመለስልዎታል።',
        continueOnBookAddis: 'በቡክአዲስ ይቀጥሉ',
    },
} as const;
