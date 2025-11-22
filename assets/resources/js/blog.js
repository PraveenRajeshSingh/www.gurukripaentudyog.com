// Blog system
const blogPosts = [
    {
        id: 1,
        title: 'How to Choose the Right Bricks for Your Construction',
        titleHi: 'अपने निर्माण के लिए सही ईंटें कैसे चुनें',
        category: 'construction',
        date: '2024-12-15',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/brick.jpeg',
        excerpt: 'Learn the essential factors to consider when selecting bricks for your construction project. Quality, strength, and durability are key...',
        excerptHi: 'अपने निर्माण परियोजना के लिए ईंटें चुनते समय विचार करने योग्य आवश्यक कारकों के बारे में जानें। गुणवत्ता, शक्ति और स्थायित्व महत्वपूर्ण हैं...',
        content: `
            <h3>Introduction</h3>
            <p>Choosing the right bricks for your construction project is crucial for ensuring the longevity and strength of your building. With over 25 years of experience, Gurukripa Bricks understands the importance of quality brick selection.</p>
            
            <h3>Key Factors to Consider</h3>
            <h4>1. Brick Grade</h4>
            <p>Bricks are classified into four grades: First-Class, Second-Class, Third-Class, and Fourth-Class. For visible structural work, always choose First-Class bricks which have uniform shape, consistent color, and water absorption less than 15%.</p>
            
            <h4>2. Water Absorption</h4>
            <p>Lower water absorption indicates better quality. First-Class bricks have less than 15% water absorption, making them ideal for load-bearing walls and exposed surfaces.</p>
            
            <h4>3. Compressive Strength</h4>
            <p>The compressive strength of bricks determines their load-bearing capacity. Premium quality bricks should have a minimum compressive strength of 10.5 N/mm².</p>
            
            <h4>4. Shape and Size</h4>
            <p>Uniform size and shape ensure better construction quality, reduced mortar usage, and a cleaner finish. Machine-made bricks offer superior consistency compared to handmade ones.</p>
            
            <h4>5. Color and Texture</h4>
            <p>Well-burnt bricks have a rich red or copper color. The color should be uniform throughout, indicating proper firing in the kiln.</p>
            
            <h3>Testing Brick Quality</h3>
            <p>Before purchasing, test bricks by:</p>
            <ul>
                <li>Striking two bricks together - they should produce a clear metallic sound</li>
                <li>Checking for cracks, chips, or deformities</li>
                <li>Ensuring uniform color and texture</li>
                <li>Verifying water absorption rate</li>
            </ul>
            
            <h3>Conclusion</h3>
            <p>Investing in quality bricks from a trusted manufacturer like Gurukripa Bricks ensures your construction project stands the test of time. Our First-Class bricks meet all quality standards and are perfect for residential and commercial construction.</p>
        `,
        contentHi: `
            <h3>परिचय</h3>
            <p>अपने निर्माण परियोजना के लिए सही ईंटें चुनना आपकी इमारत की दीर्घायु और शक्ति सुनिश्चित करने के लिए महत्वपूर्ण है। 25 से अधिक वर्षों के अनुभव के साथ, गुरुकृपा ईंट गुणवत्तापूर्ण ईंट चयन के महत्व को समझती है।</p>
            
            <h3>विचार करने योग्य मुख्य कारक</h3>
            <h4>1. ईंट ग्रेड</h4>
            <p>ईंटों को चार ग्रेड में वर्गीकृत किया गया है: प्रथम श्रेणी, द्वितीय श्रेणी, तृतीय श्रेणी, और चतुर्थ श्रेणी। दृश्यमान संरचनात्मक कार्य के लिए, हमेशा प्रथम श्रेणी की ईंटें चुनें जिनमें समान आकार, सुसंगत रंग और 15% से कम पानी अवशोषण हो।</p>
            
            <h4>2. पानी अवशोषण</h4>
            <p>कम पानी अवशोषण बेहतर गुणवत्ता का संकेत देता है। प्रथम श्रेणी की ईंटों में 15% से कम पानी अवशोषण होता है, जो उन्हें भार वहन करने वाली दीवारों और उजागर सतहों के लिए आदर्श बनाता है।</p>
            
            <h4>3. संपीड़न शक्ति</h4>
            <p>ईंटों की संपीड़न शक्ति उनकी भार वहन क्षमता निर्धारित करती है। प्रीमियम गुणवत्ता वाली ईंटों में न्यूनतम 10.5 N/mm² की संपीड़न शक्ति होनी चाहिए।</p>
            
            <h4>4. आकार और आकृति</h4>
            <p>समान आकार और आकृति बेहतर निर्माण गुणवत्ता, कम मोर्टार उपयोग और साफ फिनिश सुनिश्चित करती है। मशीन से बनी ईंटें हस्तनिर्मित लोगों की तुलना में बेहतर स्थिरता प्रदान करती हैं।</p>
            
            <h4>5. रंग और बनावट</h4>
            <p>अच्छी तरह से जली हुई ईंटों का रंग गहरा लाल या तांबे जैसा होता है। रंग पूरे में समान होना चाहिए, जो भट्टी में उचित फायरिंग का संकेत देता है।</p>
            
            <h3>ईंट गुणवत्ता का परीक्षण</h3>
            <p>खरीदने से पहले, ईंटों का परीक्षण करें:</p>
            <ul>
                <li>दो ईंटों को एक साथ मारकर - उन्हें स्पष्ट धात्विक ध्वनि उत्पन्न करनी चाहिए</li>
                <li>दरारें, चिप्स, या विकृतियों की जांच करना</li>
                <li>समान रंग और बनावट सुनिश्चित करना</li>
                <li>पानी अवशोषण दर सत्यापित करना</li>
            </ul>
            
            <h3>निष्कर्ष</h3>
            <p>गुरुकृपा ईंट जैसे विश्वसनीय निर्माता से गुणवत्तापूर्ण ईंटों में निवेश करना आपके निर्माण परियोजना को समय की कसौटी पर खरा उतरने की गारंटी देता है। हमारी प्रथम श्रेणी की ईंटें सभी गुणवत्ता मानकों को पूरा करती हैं और आवासीय और वाणिज्यिक निर्माण के लिए परफेक्ट हैं।</p>
        `
    },
    {
        id: 2,
        title: 'Benefits of Machine-Made Bricks',
        titleHi: 'मशीन से बनी ईंटों के फायदे',
        category: 'quality',
        date: '2024-12-10',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/gurukripaEnt1.png',
        excerpt: 'Discover why machine-made bricks are superior to traditional handmade bricks. Learn about consistency, strength, and cost-effectiveness...',
        excerptHi: 'जानें कि मशीन से बनी ईंटें पारंपरिक हस्तनिर्मित ईंटों से बेहतर क्यों हैं। स्थिरता, शक्ति और लागत प्रभावशीलता के बारे में जानें...',
        content: `
            <h3>Why Choose Machine-Made Bricks?</h3>
            <p>Machine-made bricks have revolutionized the construction industry with their superior quality, consistency, and efficiency. At Gurukripa Bricks, we specialize in producing high-quality machine-made bricks that meet international standards.</p>
            
            <h3>Key Advantages</h3>
            <h4>1. Uniform Size and Shape</h4>
            <p>Machine-made bricks are produced with precise dimensions, ensuring every brick is identical in size and shape. This uniformity leads to:</p>
            <ul>
                <li>Reduced mortar consumption (up to 30% savings)</li>
                <li>Faster construction time</li>
                <li>Cleaner, more professional appearance</li>
                <li>Better structural integrity</li>
            </ul>
            
            <h4>2. Superior Strength</h4>
            <p>Our machine-made bricks undergo controlled manufacturing processes that ensure:</p>
            <ul>
                <li>Higher compressive strength (10.5-15 N/mm²)</li>
                <li>Better load-bearing capacity</li>
                <li>Reduced breakage during handling and construction</li>
                <li>Long-term durability</li>
            </ul>
            
            <h4>3. Consistent Quality</h4>
            <p>Unlike handmade bricks, machine-made bricks offer:</p>
            <ul>
                <li>Uniform color throughout the batch</li>
                <li>Consistent density and weight</li>
                <li>Predictable water absorption rates</li>
                <li>Reliable performance characteristics</li>
            </ul>
            
            <h4>4. Cost-Effectiveness</h4>
            <p>While the initial cost may be slightly higher, machine-made bricks offer:</p>
            <ul>
                <li>Lower wastage during construction</li>
                <li>Reduced labor costs due to faster construction</li>
                <li>Less mortar required</li>
                <li>Better long-term value</li>
            </ul>
            
            <h4>5. Environmental Benefits</h4>
            <p>Modern brick-making machines are designed to:</p>
            <ul>
                <li>Optimize raw material usage</li>
                <li>Reduce energy consumption</li>
                <li>Minimize waste production</li>
                <li>Ensure consistent firing temperatures</li>
            </ul>
            
            <h3>Quality Standards</h3>
            <p>Our machine-made bricks at Gurukripa Bricks meet First-Class quality standards with:</p>
            <ul>
                <li>Water absorption: Less than 15%</li>
                <li>Compressive strength: Minimum 10.5 N/mm²</li>
                <li>Uniform dimensions: ±2mm tolerance</li>
                <li>No cracks, chips, or deformities</li>
            </ul>
            
            <h3>Conclusion</h3>
            <p>Machine-made bricks from Gurukripa Bricks represent the perfect combination of quality, consistency, and value. Choose our premium machine-made bricks for your next construction project and experience the difference.</p>
        `,
        contentHi: `
            <h3>मशीन से बनी ईंटें क्यों चुनें?</h3>
            <p>मशीन से बनी ईंटों ने अपनी उत्कृष्ट गुणवत्ता, स्थिरता और दक्षता के साथ निर्माण उद्योग में क्रांति ला दी है। गुरुकृपा ईंट में, हम अंतर्राष्ट्रीय मानकों को पूरा करने वाली उच्च गुणवत्ता वाली मशीन से बनी ईंटों के उत्पादन में विशेषज्ञ हैं।</p>
            
            <h3>मुख्य लाभ</h3>
            <h4>1. समान आकार और आकृति</h4>
            <p>मशीन से बनी ईंटें सटीक आयामों के साथ उत्पादित की जाती हैं, जिससे हर ईंट आकार और आकृति में समान होती है। यह एकरूपता निम्नलिखित में योगदान देती है:</p>
            <ul>
                <li>कम मोर्टार खपत (30% तक बचत)</li>
                <li>तेज निर्माण समय</li>
                <li>साफ, अधिक पेशेवर उपस्थिति</li>
                <li>बेहतर संरचनात्मक अखंडता</li>
            </ul>
            
            <h4>2. उत्कृष्ट शक्ति</h4>
            <p>हमारी मशीन से बनी ईंटें नियंत्रित विनिर्माण प्रक्रियाओं से गुजरती हैं जो सुनिश्चित करती हैं:</p>
            <ul>
                <li>उच्च संपीड़न शक्ति (10.5-15 N/mm²)</li>
                <li>बेहतर भार वहन क्षमता</li>
                <li>हैंडलिंग और निर्माण के दौरान कम टूट-फूट</li>
                <li>दीर्घकालिक स्थायित्व</li>
            </ul>
            
            <h4>3. सुसंगत गुणवत्ता</h4>
            <p>हस्तनिर्मित ईंटों के विपरीत, मशीन से बनी ईंटें प्रदान करती हैं:</p>
            <ul>
                <li>बैच भर में समान रंग</li>
                <li>सुसंगत घनत्व और वजन</li>
                <li>पूर्वानुमानित पानी अवशोषण दर</li>
                <li>विश्वसनीय प्रदर्शन विशेषताएं</li>
            </ul>
            
            <h4>4. लागत प्रभावशीलता</h4>
            <p>जबकि प्रारंभिक लागत थोड़ी अधिक हो सकती है, मशीन से बनी ईंटें प्रदान करती हैं:</p>
            <ul>
                <li>निर्माण के दौरान कम बर्बादी</li>
                <li>तेज निर्माण के कारण कम श्रम लागत</li>
                <li>कम मोर्टार आवश्यक</li>
                <li>बेहतर दीर्घकालिक मूल्य</li>
            </ul>
            
            <h3>गुणवत्ता मानक</h3>
            <p>गुरुकृपा ईंट में हमारी मशीन से बनी ईंटें प्रथम श्रेणी की गुणवत्ता मानकों को पूरा करती हैं:</p>
            <ul>
                <li>पानी अवशोषण: 15% से कम</li>
                <li>संपीड़न शक्ति: न्यूनतम 10.5 N/mm²</li>
                <li>समान आयाम: ±2mm सहनशीलता</li>
                <li>कोई दरारें, चिप्स, या विकृतियां नहीं</li>
            </ul>
            
            <h3>निष्कर्ष</h3>
            <p>गुरुकृपा ईंट से मशीन से बनी ईंटें गुणवत्ता, स्थिरता और मूल्य का सही संयोजन हैं। अपनी अगली निर्माण परियोजना के लिए हमारी प्रीमियम मशीन से बनी ईंटें चुनें और अंतर का अनुभव करें।</p>
        `
    },
    {
        id: 3,
        title: 'Maintaining Brick Quality in Construction',
        titleHi: 'निर्माण में ईंट की गुणवत्ता बनाए रखना',
        category: 'tips',
        date: '2024-12-05',
        author: 'Gurukripa Team',
        image: 'assets/resources/img/redbrick1.jpg',
        excerpt: 'Essential tips and best practices for maintaining brick quality during construction. Learn proper storage, handling, and construction techniques...',
        excerptHi: 'निर्माण के दौरान ईंट की गुणवत्ता बनाए रखने के लिए आवश्यक सुझाव और सर्वोत्तम प्रथाएं। उचित भंडारण, हैंडलिंग और निर्माण तकनीक सीखें...',
        content: `
            <h3>Introduction</h3>
            <p>Maintaining brick quality during construction is essential for ensuring the structural integrity and longevity of your building. Even the best quality bricks can be compromised if not handled and used correctly.</p>
            
            <h3>Proper Storage</h3>
            <h4>1. Storage Location</h4>
            <ul>
                <li>Store bricks on a flat, dry, and elevated platform</li>
                <li>Keep them away from direct sunlight and rain</li>
                <li>Ensure proper ventilation to prevent moisture accumulation</li>
                <li>Cover with tarpaulin during monsoon season</li>
            </ul>
            
            <h4>2. Stacking Method</h4>
            <ul>
                <li>Stack bricks in layers with proper alignment</li>
                <li>Maximum height: 1.5 meters to prevent toppling</li>
                <li>Leave gaps between stacks for air circulation</li>
                <li>Use wooden planks or pallets to keep bricks off the ground</li>
            </ul>
            
            <h3>Handling Best Practices</h3>
            <h4>1. Transportation</h4>
            <ul>
                <li>Handle bricks carefully to avoid chipping or breaking</li>
                <li>Use proper lifting techniques</li>
                <li>Transport in covered vehicles to protect from weather</li>
                <li>Avoid dropping bricks from height</li>
            </ul>
            
            <h4>2. On-Site Handling</h4>
            <ul>
                <li>Inspect bricks before use - reject damaged ones</li>
                <li>Sort bricks by size and quality before construction</li>
                <li>Keep bricks dry before use</li>
                <li>Handle with clean hands to avoid staining</li>
            </ul>
            
            <h3>Construction Techniques</h3>
            <h4>1. Soaking Bricks</h4>
            <p>Before use, soak bricks in water for 2-4 hours or until air bubbles stop appearing. This prevents:</p>
            <ul>
                <li>Excessive water absorption from mortar</li>
                <li>Weak bonding between bricks and mortar</li>
                <li>Cracking due to shrinkage</li>
            </ul>
            
            <h4>2. Mortar Quality</h4>
            <ul>
                <li>Use proper cement-sand ratio (1:4 or 1:6)</li>
                <li>Ensure mortar consistency is not too dry or too wet</li>
                <li>Use fresh mortar - don't use mortar that has started setting</li>
                <li>Apply mortar evenly on all surfaces</li>
            </ul>
            
            <h4>3. Laying Technique</h4>
            <ul>
                <li>Maintain uniform joint thickness (10-12mm)</li>
                <li>Ensure proper alignment and leveling</li>
                <li>Fill all joints completely with mortar</li>
                <li>Remove excess mortar immediately</li>
                <li>Use proper bonding patterns (English bond, Flemish bond)</li>
            </ul>
            
            <h3>Quality Control During Construction</h3>
            <ul>
                <li>Regular inspection of brickwork</li>
                <li>Check for proper alignment and plumb</li>
                <li>Ensure consistent joint thickness</li>
                <li>Test mortar strength periodically</li>
                <li>Protect completed work from weather</li>
            </ul>
            
            <h3>Common Mistakes to Avoid</h3>
            <ul>
                <li>Using wet or damaged bricks</li>
                <li>Inadequate soaking of bricks</li>
                <li>Poor mortar quality or incorrect ratio</li>
                <li>Inconsistent joint thickness</li>
                <li>Not protecting brickwork from rain during construction</li>
            </ul>
            
            <h3>Conclusion</h3>
            <p>By following these best practices, you can ensure that the high-quality bricks from Gurukripa Bricks maintain their properties throughout the construction process, resulting in a strong, durable, and beautiful structure.</p>
        `,
        contentHi: `
            <h3>परिचय</h3>
            <p>निर्माण के दौरान ईंट की गुणवत्ता बनाए रखना आपकी इमारत की संरचनात्मक अखंडता और दीर्घायु सुनिश्चित करने के लिए आवश्यक है। यहां तक कि सर्वोत्तम गुणवत्ता वाली ईंटें भी समझौता कर सकती हैं यदि उन्हें सही तरीके से हैंडल और उपयोग नहीं किया जाता है।</p>
            
            <h3>उचित भंडारण</h3>
            <h4>1. भंडारण स्थान</h4>
            <ul>
                <li>ईंटों को एक सपाट, सूखे, और ऊंचे प्लेटफॉर्म पर स्टोर करें</li>
                <li>उन्हें सीधी धूप और बारिश से दूर रखें</li>
                <li>नमी जमाव को रोकने के लिए उचित वेंटिलेशन सुनिश्चित करें</li>
                <li>मानसून के मौसम के दौरान तिरपाल से ढकें</li>
            </ul>
            
            <h4>2. स्टैकिंग विधि</h4>
            <ul>
                <li>उचित संरेखण के साथ ईंटों को परतों में स्टैक करें</li>
                <li>अधिकतम ऊंचाई: गिरने से रोकने के लिए 1.5 मीटर</li>
                <li>हवा के संचलन के लिए स्टैक के बीच अंतराल छोड़ें</li>
                <li>ईंटों को जमीन से दूर रखने के लिए लकड़ी के तख्ते या पैलेट का उपयोग करें</li>
            </ul>
            
            <h3>हैंडलिंग सर्वोत्तम प्रथाएं</h3>
            <h4>1. परिवहन</h4>
            <ul>
                <li>चिपिंग या टूटने से बचने के लिए ईंटों को सावधानी से हैंडल करें</li>
                <li>उचित उठाने की तकनीक का उपयोग करें</li>
                <li>मौसम से सुरक्षा के लिए कवर वाहनों में परिवहन करें</li>
                <li>ऊंचाई से ईंटें गिराने से बचें</li>
            </ul>
            
            <h4>2. साइट पर हैंडलिंग</h4>
            <ul>
                <li>उपयोग से पहले ईंटों का निरीक्षण करें - क्षतिग्रस्त को अस्वीकार करें</li>
                <li>निर्माण से पहले आकार और गुणवत्ता के अनुसार ईंटों को छांटें</li>
                <li>उपयोग से पहले ईंटों को सूखा रखें</li>
                <li>दाग लगाने से बचने के लिए साफ हाथों से हैंडल करें</li>
            </ul>
            
            <h3>निर्माण तकनीक</h3>
            <h4>1. ईंटों को भिगोना</h4>
            <p>उपयोग से पहले, ईंटों को 2-4 घंटे या जब तक हवा के बुलबुले दिखना बंद न हो जाएं, पानी में भिगोएं। यह रोकता है:</p>
            <ul>
                <li>मोर्टार से अत्यधिक पानी अवशोषण</li>
                <li>ईंटों और मोर्टार के बीच कमजोर बंधन</li>
                <li>सिकुड़न के कारण दरारें</li>
            </ul>
            
            <h4>2. मोर्टार गुणवत्ता</h4>
            <ul>
                <li>उचित सीमेंट-रेत अनुपात (1:4 या 1:6) का उपयोग करें</li>
                <li>सुनिश्चित करें कि मोर्टार स्थिरता बहुत सूखी या बहुत गीली नहीं है</li>
                <li>ताजा मोर्टार का उपयोग करें - उस मोर्टार का उपयोग न करें जो सेट होना शुरू हो गया है</li>
                <li>सभी सतहों पर समान रूप से मोर्टार लगाएं</li>
            </ul>
            
            <h4>3. बिछाने की तकनीक</h4>
            <ul>
                <li>समान जोड़ मोटाई (10-12mm) बनाए रखें</li>
                <li>उचित संरेखण और लेवलिंग सुनिश्चित करें</li>
                <li>सभी जोड़ों को मोर्टार से पूरी तरह भरें</li>
                <li>अतिरिक्त मोर्टार को तुरंत हटा दें</li>
                <li>उचित बॉन्डिंग पैटर्न (English bond, Flemish bond) का उपयोग करें</li>
            </ul>
            
            <h3>निर्माण के दौरान गुणवत्ता नियंत्रण</h3>
            <ul>
                <li>ईंटवर्क का नियमित निरीक्षण</li>
                <li>उचित संरेखण और सीधापन की जांच करें</li>
                <li>सुसंगत जोड़ मोटाई सुनिश्चित करें</li>
                <li>समय-समय पर मोर्टार शक्ति का परीक्षण करें</li>
                <li>पूर्ण कार्य को मौसम से सुरक्षित रखें</li>
            </ul>
            
            <h3>बचने के लिए सामान्य गलतियां</h3>
            <ul>
                <li>गीली या क्षतिग्रस्त ईंटों का उपयोग</li>
                <li>ईंटों का अपर्याप्त भिगोना</li>
                <li>खराब मोर्टार गुणवत्ता या गलत अनुपात</li>
                <li>असुसंगत जोड़ मोटाई</li>
                <li>निर्माण के दौरान बारिश से ईंटवर्क की सुरक्षा न करना</li>
            </ul>
            
            <h3>निष्कर्ष</h3>
            <p>इन सर्वोत्तम प्रथाओं का पालन करके, आप यह सुनिश्चित कर सकते हैं कि गुरुकृपा ईंट से उच्च गुणवत्ता वाली ईंटें निर्माण प्रक्रिया के दौरान अपने गुणों को बनाए रखती हैं, जिसके परिणामस्वरूप एक मजबूत, टिकाऊ और सुंदर संरचना बनती है।</p>
        `
    }
];

const blogCategories = [
    { id: 'all', name: 'All Categories', nameHi: 'सभी श्रेणियां' },
    { id: 'construction', name: 'Construction', nameHi: 'निर्माण' },
    { id: 'quality', name: 'Quality', nameHi: 'गुणवत्ता' },
    { id: 'tips', name: 'Tips', nameHi: 'सुझाव' }
];

let currentBlogCategory = 'all';

function renderBlogPosts() {
    const container = document.getElementById('blogPosts');
    if (!container) return;
    
    const filteredPosts = currentBlogCategory === 'all' 
        ? blogPosts 
        : blogPosts.filter(post => post.category === currentBlogCategory);
    
    container.innerHTML = '';
    
    if (filteredPosts.length === 0) {
        container.innerHTML = '<div class="no-posts"><p>No blog posts found</p></div>';
        return;
    }
    
    const isHindi = currentLanguage === 'hi';
    filteredPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'blog-card';
        postCard.innerHTML = `
            <div class="blog-image">
                <img src="${post.image}" alt="${isHindi ? post.titleHi : post.title}" />
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-date">${formatDate(post.date)}</span>
                    <span class="blog-category">${getCategoryName(post.category)}</span>
                    <span class="blog-author">${post.author}</span>
                </div>
                <h3>${isHindi ? post.titleHi : post.title}</h3>
                <p>${isHindi ? post.excerptHi : post.excerpt}</p>
                <a href="#" class="btn-read-more" onclick="viewBlogPost(${post.id}); return false;">
                    ${getTranslation('readMore')}
                </a>
            </div>
        `;
        container.appendChild(postCard);
    });
}

function getCategoryName(categoryId) {
    const category = blogCategories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return currentLanguage === 'hi' ? category.nameHi : category.name;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function setBlogCategory(category) {
    currentBlogCategory = category;
    renderBlogPosts();
    updateBlogCategoryButtons();
}

function updateBlogCategoryButtons() {
    const buttons = document.querySelectorAll('.blog-category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === currentBlogCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function viewBlogPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isHindi = currentLanguage === 'hi';
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="this.closest('.blog-modal').remove()">&times;</span>
            <div class="blog-modal-body">
                <img src="${post.image}" alt="${isHindi ? post.titleHi : post.title}" />
                <div class="blog-modal-meta">
                    <span>${formatDate(post.date)}</span>
                    <span>${getCategoryName(post.category)}</span>
                    <span>${post.author}</span>
                </div>
                <h2>${isHindi ? post.titleHi : post.title}</h2>
                <div class="blog-modal-content">
                    ${isHindi ? post.contentHi : post.content}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Initialize blog on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('blogPosts')) {
        renderBlogPosts();
    }
});


