/**
 * Depoimentos publicados com autorização das pessoas (confirmada pelo responsável pelo site).
 * Mantenha guardado o comprovante da autorização de cada pessoa (mensagem ou termo assinado).
 * Para remover alguém, apague o item daqui e a foto em public/depoimentos/.
 * Se a lista ficar vazia, a seção some da página inicial automaticamente.
 */
export interface Testimonial {
  name: string;
  quote: string;
  /** Caminho estático (/depoimentos/...) ou URL assinada. Sem foto, o cartão mostra a inicial do nome. */
  photo: string | null;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Camila A.",
    photo: "/depoimentos/camila.jpg",
    quote: "Gostei muito porque não precisei pagar alguém para fazer meu currículo. O site é simples, rápido e deixa tudo organizado. Consegui me candidatar a vagas com muito mais confiança. Valeu muito a pena!",
  },
  {
    name: "Lucas R.",
    photo: "/depoimentos/lucas.jpg",
    quote: "Nunca tinha feito um currículo realmente profissional. Encontrei o Currículo Gerador, preenchi minhas informações e em poucos minutos estava pronto. O resultado ficou excelente e me ajudou a apresentar melhor minhas experiências. Hoje estou trabalhando!",
  },
  {
    name: "João Pedro M.",
    photo: "/depoimentos/joao-pedro.jpg",
    quote: "Eu precisava de um currículo profissional para conseguir uma oportunidade de emprego, mas não sabia como montar um. Usei o Currículo Gerador e ficou muito melhor do que eu imaginava. Enviei para a empresa e consegui ser aprovado no processo seletivo! Recomendo demais.",
  },
  {
    name: "Mariana S.",
    photo: "/depoimentos/mariana.jpg",
    quote: "Estava procurando emprego há um tempo e meu currículo não chamava atenção. Com o site, consegui criar um currículo bonito, organizado e profissional. Depois de enviar para uma vaga, fui chamada para a entrevista e consegui a oportunidade. Foi muito fácil de usar!",
  },
];
