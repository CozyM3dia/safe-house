import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "./button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

const Gallery4 = ({ title, description, items }) => {
  const [carouselApi, setCarouselApi] = useState();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
      setScrollSnaps(carouselApi.scrollSnapList());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0f0b08' }}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl text-text-primary" style={{ fontFamily: '"Syne", sans-serif' }}>
              {title}
            </h2>
            <p className="max-w-lg text-text-muted" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.1rem', lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto rounded-full w-12 h-12 flex items-center justify-center border-white/10 hover:border-accent hover:text-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto rounded-full w-12 h-12 flex items-center justify-center border-white/10 hover:border-accent hover:text-accent"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: 'start',
            breakpoints: {
              "(max-width: 768px)": {
                dragFree: true,
              },
            },
          }}
        >
          <CarouselContent className="ml-0 2xl:ml-[max(8rem,calc(50vw-700px))] 2xl:mr-[max(0rem,calc(50vw-700px))]">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="max-w-[320px] pl-[20px] lg:max-w-[420px]"
              >
                <div 
                  className="group rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-accent/50 transition-colors duration-300" 
                  style={{ background: '#1a1208' }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="group relative h-full min-h-[28rem] max-w-full overflow-hidden md:aspect-[4/5] lg:aspect-[1/1]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 h-full bg-[linear-gradient(rgba(15,11,8,0),rgba(15,11,8,0.7),rgba(15,11,8,0.95)_100%)] mix-blend-multiply" />
                    
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-accent tracking-wider uppercase">
                        {item.location}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-text-primary md:p-8 z-10">
                      <div className="mb-2 pt-4 text-2xl font-bold md:mb-3 md:pt-4 lg:pt-4" style={{ fontFamily: '"Syne", sans-serif', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {item.title}
                      </div>
                      <div className="mb-2 line-clamp-2 text-text-secondary" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.5 }}>
                        {item.description}
                      </div>
                      <div className="mb-6 md:mb-8 text-accent text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Baca full story <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="mt-10 flex justify-center gap-3">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="group flex h-11 w-11 items-center justify-center rounded-full"
            >
              <span className={`block h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === index ? "bg-accent w-8" : "bg-white/10 w-2.5 group-hover:bg-white/30"
              }`} />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[600px] bg-[#1a1208] border-white/10 text-white overflow-hidden p-0 gap-0">
          {selectedItem?.image && (
            <div className="relative w-full bg-black/30 flex justify-center">
              <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-auto max-h-[60vh] object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1208] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-6">
                <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-accent tracking-wider uppercase">
                  {selectedItem.location}
                </span>
              </div>
            </div>
          )}
          <div className="p-6 pt-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-2 text-text-primary" style={{ fontFamily: '"Syne", sans-serif' }}>
                {selectedItem?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="text-text-secondary text-base mt-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.7 }}>
              {selectedItem?.description}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export { Gallery4 };
