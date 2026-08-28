import { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.92, 1] : [1.02, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div
      className="flex min-h-[50rem] md:min-h-[66rem] items-center justify-center relative px-2 sm:px-4 md:px-8 py-6 md:py-16"
      ref={containerRef}
    >
      <div
        className="py-4 md:py-12 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 12px 32px #0000005a, 0 40px 60px #0000004f, 0 80px 80px #00000033",
      }}
      className="max-w-5xl mt-2 md:mt-6 mx-auto w-full border border-white/10 md:border-2 md:border-white/15 p-1.5 sm:p-2.5 md:p-3.5 bg-[#140e08]/90 backdrop-blur-xl rounded-[22px] md:rounded-[30px] shadow-2xl relative z-20 pointer-events-auto"
    >
      <div className="h-full w-full overflow-hidden rounded-[18px] md:rounded-[24px] bg-[#0c0805]">
        {children}
      </div>
    </motion.div>
  );
};

