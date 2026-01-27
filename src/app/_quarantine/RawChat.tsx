"use client";

import { useChatLogic, Message } from "./useChatLogic";

type Comp_Confirmation_RequestProps = {
  message: Message;
  onApprove: (id: string) => void;
};

function Comp_Confirmation_Request({
  message,
  onApprove,
}: Comp_Confirmation_RequestProps) {
  return (
    <div className="Chat_bubble_ai flex flex-col items-start gap-[12px] max-w-[560px] p-[10px_15px] pb-[15px] rounded-[30px] bg-white/10 backdrop-blur-md border border-white/20 relative">
      <div className="BodyText w-full text-cardzzz-cream text-[14px] font-medium leading-normal relative font-satoshi break-words">
        {message.text}
      </div>
      <button
        type="button"
        onClick={() => onApprove(message.id)}
        className="Comp_Button-Primary_approve w-full flex items-center justify-center py-[10px] px-[15px] rounded-[16.168px] bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold text-[15px] leading-normal cursor-pointer hover:opacity-90 transition-opacity border-none"
      >
        approve
      </button>
    </div>
  );
}

export default function RawChat() {
  const {
    messages,
    inputValue,
    setInputValue,
    sendMessage,
    handleKeyDown,
    handleInputChange,
    scrollContainerRef,
    textareaRef,
  } = useChatLogic();

  const handleApprove = (messageId: string, onApproved?: (id: string) => void) => {
    // Placeholder for future navigation or side effects
    console.log("Approved confirmation message:", messageId);
    if (onApproved) {
      onApproved(messageId);
    }
  };

  return (
    <div className="Layout_chat flex flex-col w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden">
      {/* Navbar Section - Fixed height, no grow */}
      <div className="Section_navbar flex flex-col items-center gap-[10px] w-full h-[120px] p-[10px] shrink-0">
        <div className="Navbar flex justify-between items-center h-[100px] w-full max-w-[1400px] px-[15px] py-[30px] shrink-0 relative mx-auto">
          {/* Logo */}
          <svg
            className="Comp_logo relative"
            width="86"
            height="27"
            viewBox="0 0 86 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
              <path
                d="M17.0823 7.7486V12.4299C16.2082 11.8448 15.2343 11.3937 14.1604 11.0767C13.1114 10.7354 12.0251 10.5647 10.9012 10.5647C9.70247 10.5647 8.65355 10.7964 7.75448 11.2596C6.85541 11.6985 6.14365 12.3446 5.61919 13.198C5.11971 14.027 4.86997 15.0266 4.86997 16.197C4.86997 17.3185 5.11971 18.306 5.61919 19.1594C6.14365 19.9884 6.85541 20.6467 7.75448 21.1343C8.65355 21.5976 9.68998 21.8292 10.8638 21.8292C12.0126 21.8292 13.1114 21.6585 14.1604 21.3172C15.2343 20.9758 16.2082 20.5126 17.0823 19.9274V24.6088C16.2832 25.1452 15.3217 25.5597 14.1978 25.8522C13.099 26.1204 11.9252 26.2545 10.6765 26.2545C8.65355 26.2545 6.83044 25.8157 5.20712 24.9379C3.60877 24.0602 2.33509 22.8654 1.38607 21.3538C0.462022 19.8421 0 18.1231 0 16.197C0 14.1976 0.474509 12.4421 1.42353 10.9305C2.37255 9.41877 3.65872 8.24843 5.28204 7.41944C6.90536 6.56607 8.71599 6.13939 10.7139 6.13939C11.9626 6.13939 13.1364 6.27349 14.2353 6.54169C15.3341 6.80989 16.2832 7.2122 17.0823 7.7486Z"
                fill="#FFFADC"
              />
              <path
                d="M32.1546 20.988L32.4918 23.3653C32.1172 23.8285 31.6177 24.2918 30.9933 24.7551C30.369 25.1939 29.6447 25.5597 28.8206 25.8522C27.9964 26.1204 27.0724 26.2545 26.0485 26.2545C24.0505 26.2545 22.4772 25.7913 21.3283 24.8648C20.1795 23.9139 19.6051 22.5851 19.6051 20.8783C19.6051 19.6836 19.9548 18.6474 20.654 17.7696C21.3783 16.8919 22.3523 16.2092 23.576 15.7215C24.7998 15.2339 26.1858 14.9901 27.7342 14.9901C28.8331 14.9901 29.7696 15.0876 30.5438 15.2826C31.318 15.4777 31.8924 15.6728 32.267 15.8678L32.4543 18.7205C32.0547 18.5498 31.5178 18.4157 30.8435 18.3182C30.1692 18.1963 29.4949 18.1353 28.8206 18.1353C27.3221 18.1353 26.1484 18.3548 25.2992 18.7936C24.4751 19.2325 24.063 19.8421 24.063 20.6223C24.063 21.3538 24.3377 21.878 24.8872 22.1949C25.4366 22.5119 26.1234 22.6704 26.9475 22.6704C27.9215 22.6704 28.8705 22.5119 29.7946 22.1949C30.7436 21.8536 31.5303 21.4513 32.1546 20.988ZM31.855 14.6975C31.855 13.771 31.6552 13.0273 31.2556 12.4665C30.881 11.9057 30.369 11.4912 29.7197 11.223C29.0703 10.9548 28.3336 10.8207 27.5095 10.8207C26.036 10.8207 24.6124 11.1255 23.2389 11.7351C21.8903 12.3202 20.7914 13.0273 19.9423 13.8563V9.02866C20.3918 8.58978 21.0162 8.1509 21.8153 7.71203C22.6395 7.27315 23.5885 6.90742 24.6624 6.61484C25.7363 6.29787 26.8976 6.13939 28.1463 6.13939C29.6947 6.13939 31.1182 6.41978 32.4169 6.98057C33.7155 7.54135 34.7395 8.4313 35.4887 9.6504C36.2629 10.8451 36.65 12.4543 36.65 14.478V25.8888H32.1546V22.4875L31.855 22.0852V14.6975Z"
                fill="#FFFADC"
              />
              <path
                d="M40.956 6.50512H45.4888V10.4916L45.7885 11.1499V25.8888H40.956V6.50512ZM52.0071 6.13939C52.7063 6.13939 53.4056 6.28568 54.1049 6.57827V11.5888C53.6554 11.3449 53.1059 11.1377 52.4566 10.967C51.8322 10.7964 51.1455 10.711 50.3962 10.711C49.672 10.711 48.9727 10.8085 48.2984 11.0036C47.6491 11.1743 47.0372 11.4059 46.4628 11.6985C45.9134 11.9667 45.4389 12.2349 45.0393 12.5031L45.0018 9.5041C45.5013 8.99208 46.1007 8.48006 46.8 7.96804C47.5242 7.43164 48.3234 6.99276 49.1975 6.65141C50.0965 6.31006 51.0331 6.13939 52.0071 6.13939Z"
                fill="#FFFADC"
              />
              <path
                d="M67.3598 10.3453C66.2609 10.3453 65.2245 10.5403 64.2505 10.9305C63.2765 11.3206 62.4898 11.9545 61.8904 12.8322C61.291 13.6856 60.9913 14.856 60.9913 16.3433C60.9913 18.2451 61.4783 19.6714 62.4523 20.6223C63.4263 21.5732 64.6875 22.0486 66.2359 22.0486C66.9352 22.0486 67.597 21.9633 68.2214 21.7926C68.8707 21.5976 69.4326 21.3781 69.9071 21.1343C70.4066 20.8905 70.7562 20.6833 70.956 20.5126L71.2557 23.7676C70.8312 24.2065 70.3067 24.6209 69.6824 25.0111C69.058 25.3768 68.3462 25.6694 67.5471 25.8888C66.7479 26.1326 65.8238 26.2545 64.7749 26.2545C63.701 26.2545 62.6396 26.0717 61.5907 25.7059C60.5668 25.3402 59.6302 24.7794 58.7811 24.0236C57.957 23.2434 57.2827 22.2437 56.7582 21.0246C56.2587 19.8055 56.009 18.3548 56.009 16.6724C56.009 14.8438 56.3212 13.2711 56.9455 11.9545C57.5699 10.6135 58.4065 9.5163 59.4554 8.66293C60.5293 7.80956 61.7281 7.17562 63.0517 6.76113C64.3753 6.34664 65.7239 6.13939 67.0975 6.13939C68.3213 6.13939 69.3577 6.23692 70.2068 6.43197C71.0559 6.60265 71.8801 6.80989 72.6793 7.05371L71.2557 11.1133C70.8062 10.9183 70.2443 10.7476 69.57 10.6013C68.9206 10.4306 68.1839 10.3453 67.3598 10.3453ZM70.1693 21.9024V0.726583L75.0018 0.0682684V25.8888H70.469V22.4144L70.1693 21.9024Z"
                fill="#FFFADC"
              />
              <path
                d="M85.5704 8.94632H77.2367V7.32586L82.0951 2.04246H77.5825V0H85.2246V1.62047L80.3316 6.90386H85.5704V8.94632Z"
                fill="#FFFADC"
              />
              <path
                d="M82.6568 25.8888H77.101V24.8085L80.3399 21.2862H77.3315V19.9246H82.4262V21.0049L79.1642 24.5272H82.6568V25.8888Z"
                fill="#FFFADC"
              />
              <path
                d="M83.934 18.2166H76.9893V16.8662L81.038 12.4633H77.2774V10.7613H83.6459V12.1117L79.5683 16.5145H83.934V18.2166Z"
                fill="#FFFADC"
              />
            </svg>

            {/* Menu Icon */}
            <svg
              className="Comp_menu_icon relative"
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M35 17.5C35 27.165 27.165 35 17.5 35C7.83502 35 0 27.165 0 17.5C0 7.83502 7.83502 0 17.5 0C27.165 0 35 7.83502 35 17.5Z"
                fill="#FFFADC"
              />
              <path
                d="M9.864 25.4875L9.468 22.6495H25V25.4875H9.864Z"
                fill="#220020"
              />
              <path
                d="M9.864 18.9305L9.468 16.0925H25V18.9305H9.864Z"
                fill="#220020"
              />
              <path
                d="M9.864 12.3735L9.468 9.53548H25V12.3735H9.864Z"
                fill="#220020"
              />
            </svg>
          </div>
        </div>

      {/* Chat Section - Scrollable middle area with flex-1 and alpha fade */}
      <div
        ref={scrollContainerRef}
        className="Section_chat flex flex-col items-center flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        <div className="Section_Chat_Scroll_Area flex flex-col items-start gap-[5px] w-full max-w-[650px] min-w-[390px] mx-auto px-[15px] pt-[2rem] pb-[30px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`Chat_Bubble_Container flex flex-col justify-center gap-[10px] w-full relative ${
                message.sender === "user"
                  ? "items-end p-[5px_30px] self-end"
                  : "items-start p-[5px_30px] self-start"
              }`}
            >
              {message.type === "confirmation" && message.sender === "ai" ? (
                <Comp_Confirmation_Request
                  message={message}
                  onApprove={(id) => handleApprove(id)}
                />
              ) : (
                <div
                  className={`${
                    message.sender === "user"
                      ? "Chat_bubble_user"
                      : "Chat_bubble_ai"
                  } flex items-start content-start gap-[10px] flex-wrap max-w-[560px] p-[10px_15px] rounded-[30px] bg-white/10 backdrop-blur-md border border-white/20 relative ${
                    message.sender === "user" ? "ml-auto" : ""
                  }`}
                >
                  <div
                    className="BodyText max-w-[530px] text-cardzzz-cream text-[14px] font-medium leading-normal relative font-satoshi break-words"
                    style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                  >
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Container - Fixed height, no grow */}
      <div className="Section_Input_Container flex flex-col items-center w-full p-[15px] shrink-0">
        <div className="Section_Input flex flex-col items-center gap-[64px] w-full max-w-[650px] min-w-[390px] mx-auto px-[10px] pb-[10px] rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden relative">
          {/* Text Input with Icons Pinned to Top */}
          <div className="Comp_Text_Input flex justify-between items-start w-full relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              rows={1}
              className="PlaceholderText flex flex-col justify-start w-full min-h-[49px] max-h-[200px] text-cardzzz-cream text-[14.551px] font-medium leading-normal relative font-satoshi bg-transparent border-none outline-none placeholder:text-cardzzz-muted resize-none overflow-y-auto pt-[12px] pb-[12px]"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255, 250, 220, 0.3) transparent",
              }}
            />
            <div className="flex items-start gap-[10px] relative pt-[12px]">
              <div className="Comp_Attach flex justify-center items-center w-[28px] h-[28px] relative shrink-0">
                <img
                  src="/attach-icon.svg"
                  alt="Attach icon"
                  width={24}
                  height={24}
                  className="relative"
                />
              </div>
              <div className="Comp_Voice flex justify-center items-center w-[28px] h-[28px] relative shrink-0">
                <img
                  src="/mic-icon.svg"
                  alt="Microphone icon"
                  width={24}
                  height={24}
                  className="relative"
                />
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            className="Comp_Button-Primary_active flex h-[54px] p-[20px_10px] justify-center items-center gap-[10px] w-full rounded-[16.168px] bg-cardzzz-cream shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] relative cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            <div className="Label text-cardzzz-accent text-center text-[19.401px] font-bold leading-normal relative font-roundo">
              <span className="font-bold text-[19px] text-cardzzz-accent font-roundo">
                send
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
