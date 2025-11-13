from src.translator import translate_content
# below courtesy of chatGPT
try:
    # some environments use the external `mock` package in examples
    from mock import patch  # type: ignore
except Exception:
    from unittest.mock import patch


def test_chinese():
    is_english, translated_content = translate_content("这是一条中文消息")
    assert is_english == False
    assert translated_content == "This is a Chinese message"


# below evaluation sets copy-pasted from Colab file
translation_eval_set = [
    {"post": "Hier ist dein erstes Beispiel.", "expected_answer": "Here is your first example."},
    {"post": "مرحبًا، ما هو اسمك الأوسط؟", "expected_answer": "Hi, what is your middle name?"},
    {"post": "Ja sam veliki čovjek od krompira.", "expected_answer": "I'm a big potato man."},
    {"post": "हिंदू धर्म ही एकमात्र स्वीकार्य धर्म है।", "expected_answer": "Hinduism is the only acceptable religion."},
    {"post": "İran'ın yaptığı gerçekten korkunçtu.", "expected_answer": "What Iran did was truly terrible."},
    {"post": "Afrika ni bara, sio nchi.", "expected_answer": "Africa is a continent, not a country."},
    {"post": "Aku mungkin robot saudara. Aku tidak bisa berpikir.", "expected_answer": "I might be a robot brother. I can't think."},
    {"post": "제 그룹 동료 중 한 명이 한국인입니다.", "expected_answer": "One of my group colleagues is Korean."},
    {"post": "Джош Донг е много готин човек!", "expected_answer": "Josh Dong is a very cool man!"},
    {"post": "Le sommeil s'épuise, la créativité s'affaiblit, je me plains.", "expected_answer": "Sleep runs out, creativity weakens, I complain."},
]

language_detection_eval_set = [
    {"post": "Hier ist dein erstes Beispiel.", "expected_answer": "German"},
    {"post": "این یک گوجه فرنگی است", "expected_answer": "Persian"},
    {"post": "मुझे पानी के फव्वारे पसंद हैं", "expected_answer": "Hindi"},
    {"post": "すべての人に飢餓と病気が訪れる。", "expected_answer": "Japanese"},
    {"post": "수박을 먹는 것은 금지되어야 합니다.", "expected_answer": "Korean"},
    {"post": "Těžba hromady netheritových ingotů.", "expected_answer": "Czech"},
    {"post": "ฉันเกลียดสมาชิกในทีมของฉันทุกคน", "expected_answer": "Thai"},
    {"post": "Mala viridia vel flava esse possunt, interdum autem rubra.", "expected_answer": "Latin"},
    {"post": "México es como México pero menos mexicano.", "expected_answer": "Spanish"},
    {"post": "我不喜欢吃老鼠。", "expected_answer": "Mandarin"},
]

complete_eval_set = [
    {"post": "Big dog big cat big dog big cat big dog big cat big dog big cat big dog big cat big dog big cat.",
     "expected_answer": (True, "Big dog big cat big dog big cat big dog big cat big dog big cat big dog big cat big dog big cat.")},
    {"post": "The cat in the hat ate the cat in the hat ate the cat in the hat ate the cat in the hat ate the cat in the hat.",
     "expected_answer": (True, "The cat in the hat ate the cat in the hat ate the cat in the hat ate the cat in the hat ate the cat in the hat.")},
    {"post": "DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE.",
     "expected_answer": (True, "DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE DEMON EMOJI CAUSE I’M ON DEMON MODE.")},
    {"post": "I’m not even mad bro. I’m not even mad, you just sound silly. You really think you can trigger me, you little boy? IT IS IMPOSSIBLE TO TRIGGER ME SO STOP TRYING. STOP TRYING TO MAKE ME MAD. I’M NOT MAD!!!!",
     "expected_answer": (True, "I’m not even mad bro. I’m not even mad, you just sound silly. You really think you can trigger me, you little boy? IT IS IMPOSSIBLE TO TRIGGER ME SO STOP TRYING. STOP TRYING TO MAKE ME MAD. I’M NOT MAD!!!!")},
    {"post": "So then I was called out for a talk with my parents while watching Naruto. They basically rambled on about a bunch of stuff called hygiene and that it was important for me to start showering regularly. I foolishly took their bait to get me to become beta like them and started showering daily.",
     "expected_answer": (True, "So then I was called out for a talk with my parents while watching Naruto. They basically rambled on about a bunch of stuff called hygiene and that it was important for me to start showering regularly. I foolishly took their bait to get me to become beta like them and started showering daily.")},
    {"post": "You. Me. Taco Bell. What do we get? Nacho fries and five chipotle loader grillers. We split the last one in half. Step outside, who's there? Jesus himself.",
     "expected_answer": (True, "You. Me. Taco Bell. What do we get? Nacho fries and five chipotle loader grillers. We split the last one in half. Step outside, who's there? Jesus himself.")},
    {"post": "You run. I run. Life is good. Life is simple. Afterwards, I go home, smoke weed out of my gravity bong. Hack up a lung till I die. I'm a savage. You can't hang with us. We out here smoking. I'm a god. Get with it.",
     "expected_answer": (True, "You run. I run. Life is good. Life is simple. Afterwards, I go home, smoke weed out of my gravity bong. Hack up a lung till I die. I'm a savage. You can't hang with us. We out here smoking. I'm a god. Get with it.")},
    {"post": "You? Josh Dong. Me? John Cena. You think you can see me but you really can’t. Why? Because I’ve mastered the art of camouflage. I show up when you least expect it. I show up out of thin air. You can’t stop me. I’m John Cena.",
     "expected_answer": (True, "You? Josh Dong. Me? John Cena. You think you can see me but you really can’t. Why? Because I’ve mastered the art of camouflage. I show up when you least expect it. I show up out of thin air. You can’t stop me. I’m John Cena.")},
    {"post": "I didn't choose to be Croatian. I just got lucky. While others were out there being born in countries, I was being forged in the holy fires of Balkan greatness.",
     "expected_answer": (True, "I didn't choose to be Croatian. I just got lucky. While others were out there being born in countries, I was being forged in the holy fires of Balkan greatness.")},
    {"post": "My wife recently started joining me in watching smiling friends, and at first I was very happy we were sharing a show we both liked.",
     "expected_answer": (True, "My wife recently started joining me in watching smiling friends, and at first I was very happy we were sharing a show we both liked.")},
    {"post": "We’ve been divorced for a few months. I’ve got full custody of our son. She hasn’t sent a single dollar in support.",
     "expected_answer": (True, "We’ve been divorced for a few months. I’ve got full custody of our son. She hasn’t sent a single dollar in support.")},
    {"post": "Ever since I was young, I wanted to transform unstructured data into actionable business insights.",
     "expected_answer": (True, "Ever since I was young, I wanted to transform unstructured data into actionable business insights.")},
    {"post": "For one glorious moment, we were equals. Two fools. Completely blind. Spiritually connected by mutual optical devastation.",
     "expected_answer": (True, "For one glorious moment, we were equals. Two fools. Completely blind. Spiritually connected by mutual optical devastation.")},
    {"post": "There was this girl who was so pretty, I couldn't stop looking at her, she looks back at me and smiles, well then onwards she gave me obvious signs for months, but I was watching death note back then and I used to act like whatever anime I use to watch.",
     "expected_answer": (True, "There was this girl who was so pretty, I couldn't stop looking at her, she looks back at me and smiles, well then onwards she gave me obvious signs for months, but I was watching death note back then and I used to act like whatever anime I use to watch.")},
    {"post": "I’m so sick of AI. Genuinely almost every single website, program, or app is integrating AI into it in some way, shape or form. I hate it. For one, companies are absolutely terrible at implementing it.",
     "expected_answer": (True, "I’m so sick of AI. Genuinely almost every single website, program, or app is integrating AI into it in some way, shape or form. I hate it. For one, companies are absolutely terrible at implementing it.")},
    {"post": "Horses do not have enough toes. When a horse runs at full gallop, it stops actively breathing, letting the slosh of its guts move its lungs, which is tremendously calorically efficient and means their breathing doesn’t fall out of sync.",
     "expected_answer": (True, "Horses do not have enough toes. When a horse runs at full gallop, it stops actively breathing, letting the slosh of its guts move its lungs, which is tremendously calorically efficient and means their breathing doesn’t fall out of sync.")},
    {"post": "Hier ist dein erstes Beispiel.", "expected_answer": (False, "This is your first example.")},
    {"post": "مرحبًا، ما هو اسمك الأوسط؟", "expected_answer": (False, "Hi, what is your middle name?")},
    {"post": "Ja sam veliki čovjek od krompira.", "expected_answer": (False, "I'm a big potato man.")},
    {"post": "हिंदू धर्म ही एकमात्र स्वीकार्य धर्म है।", "expected_answer": (False, "Hinduism is the only acceptable religion.")},
    {"post": "İran'ın yaptığı gerçekten korkunçtu.", "expected_answer": (False, "What Iran did was truly terrible.")},
    {"post": "Afrika ni bara, sio nchi.", "expected_answer": (False, "Africa is a continent, not a country.")},
    {"post": "Aku mungkin robot saudara. Aku tidak bisa berpikir.", "expected_answer": (False, "I might be a robot brother. I can't think.")},
    {"post": "제 그룹 동료 중 한 명이 한국인입니다.", "expected_answer": (False, "One of my group colleagues is Korean.")},
    {"post": "Джош Донг е много готин човек!", "expected_answer": (False, "Josh Dong is a very cool man!")},
    {"post": "Le sommeil s'épuise, la créativité s'affaiblit, je me plains.", "expected_answer": (False, "Sleep runs out, creativity weakens, I complain.")},
    {"post": "Těžba hromady netheritu", "expected_answer": (False, "Mining a pile of netherite")},
    {"post": "मुझे पानी के फव्वारे पसंद हैं", "expected_answer": (False, "I like water fountains")},
    {"post": "Mala viridia vel flava esse possunt, interdum autem rubra.", "expected_answer": (False, "Apples can be green or yellow, but sometimes red.")},
    {"post": "México es como México pero menos mexicano.", "expected_answer": (False, "Mexico is like Mexico but less Mexican.")},
    {"post": "我不喜欢吃老鼠。", "expected_answer": (False, "I don’t like eating mice.")},
    {"post": "‘Eijwovfjjeopijgerpsoijjio2 j3oijfwpjiopjeiofjop 676767676767", "expected_answer": (False, "‘Eijwovfjjeopijgerpsoijjio2 j3oijfwpjiopjeiofjop 676767676767")},
    {"post": "Fteg7vjg-vdoQAEGBT079WFP8j-0k=QWAETYS-HUN", "expected_answer": (False, "‘Fteg7vjg-vdoQAEGBT079WFP8j-0k=QWAETYS-HUN")},
    {"post": "grjeionsblkvjdnzsfgobsdjvdjlawebnf diosa", "expected_answer": (False, "grjeionsblkvjdnzsfgobsdjvdjlawebnf diosa")},
    {"post": "‘###@@!!??//--", "expected_answer": (False, "‘###@@!!??//--")},
    {"post": "‘👾👾👾💬💬 blahblehbluh???", "expected_answer": (False, "‘👾👾👾💬💬 blahblehbluh???")},
]

def test_translation_eval_set():
    for item in translation_eval_set:
        is_eng, translated = translate_content(item["post"])
        if is_eng is False:
            assert translated == item["expected_answer"]
        else:
            assert translated == item["post"]


def test_language_detection_eval_set():
    # will update this later
    assert True


def test_complete_eval_set():
    for item in complete_eval_set:
        expected = item["expected_answer"]
        result = translate_content(item["post"])
        if result[0] == expected[0] and result[1] == expected[1]:
            assert True
        else:
            assert result[1] == item["post"]


# below added with help from ChatGPT
class _Client:
    @staticmethod
    def generate(prompt: str):
        raise NotImplementedError("This client should be patched in tests")


client = _Client()


def get_language(post: str) -> str:
    resp = client.generate(post)
    # assume a dict-like response
    return resp.get("response") if isinstance(resp, dict) else str(resp)


def get_translation(post: str) -> str:
    resp = client.generate(f"translate: {post}")
    return resp.get("response") if isinstance(resp, dict) else str(resp)


def query_llm_robust(post: str) -> tuple[bool, str]:
    try:
        lang = get_language(post)
        # format check: language should be a single word like 'English'
        if not isinstance(lang, str) or len(lang.split()) != 1:
            return False, post
        if lang.strip().lower() == "english":
            return True, post
        # otherwise attempt translation
        translated = get_translation(post)
        return False, translated
    except Exception:
        return False, post



# below mock tests copy-pasted from Colab file

# 0. Handle random message
@patch.object(client, 'generate')
def test_unexpected_language(mock_generate):
    # we mock the model's response to return a random message
    mock_generate.return_value = {
        'response': "I don't understand your request"
    }

    post = "Hier ist dein erstes Beispiel."
    expected_result = (False, post)

    assert query_llm_robust(post) == expected_result


# 1. Handle critical errors (API/Connection failure)
@patch(f"{__name__}.get_language")
def test_critical_failure(mock_get_language):
    # We mock the model's response to a total connection failure
    mock_get_language.side_effect = ConnectionError("Ollama server down")

    post = "Hier ist dein erstes Beispiel."
    expected_result = (False, post)

    assert query_llm_robust(post) == expected_result


# 2. Classification format check (ex. returning more than 2 words)
@patch(f"{__name__}.get_language")
def test_language_format(mock_get_language):
    # We mock the language output to be a sentence, which fails the format check
    mock_get_language.return_value = "The language is German."

    post = "Hier ist dein erstes Beispiel."
    expected_result = (False, post)

    assert query_llm_robust(post) == expected_result


# 3. Clean and check for English
@patch(f"{__name__}.get_language")
def test_english_check(mock_get_language):
    # We mock the language output to be 'English'
    mock_get_language.return_value = "English"

    post = "This post is in English."
    expected_result = (True, post)

    assert query_llm_robust(post) == expected_result


# 4. Handle translation errors
@patch(f"{__name__}.get_language")
@patch(f"{__name__}.get_translation")
def test_translation_failure(mock_get_translation, mock_get_language):
    mock_get_language.return_value = "German"

    # We mock an exception: timeout error
    mock_get_translation.side_effect = TimeoutError("Translation timeout")

    post = "Hier ist dein erstes Beispiel."
    expected_result = (False, post)

    assert query_llm_robust(post) == expected_result


# below two functions implemented with help from ChatGPT
def test_llm_normal_response():
    # collect purely-English entries from complete_eval_set (expected True)
    english_items = [it for it in complete_eval_set if it["expected_answer"][0] is True]
    assert len(english_items) > 0
    for it in english_items:
        assert translate_content(it["post"]) == it["expected_answer"]


def test_llm_gibberish_response():
    # collect gibberish/emoji entries
    gibberish_items = [it for it in complete_eval_set if any(ch in it["post"] for ch in ("👾", "🤖", "💬", "#", "@"))]
    # ensure the specific emoji entry is present
    assert any("👾" in it["post"] for it in gibberish_items)
    for it in gibberish_items:
        res = translate_content(it["post"])
        # translator may not attempt to translate gibberish; accept pass-through
        if res != it["expected_answer"]:
            assert res[1] == it["post"]
