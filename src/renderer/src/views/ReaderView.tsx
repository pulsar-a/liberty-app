import bookBg from '@/assets/images/reader/bg-light-1.jpg'
import { RouteEntry } from '@app-types/router.types'
import { BookContentsList } from '../layouts/parts/BookContentsList'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'

export const ReaderView: React.FC = () => {
  const contents: RouteEntry[] = [
    {
      id: 'Introduction',
      name: 'Introduction',
      to: `/reader`,
      hash: '#Introduction',
      children: [
        {
          id: 'what',
          name: 'What can you do to earn all money in the world today and tomorrow?',
          to: `/reader`,
          hash: '#what',
        },
        {
          id: 'didnt-work',
          name: "If it didn't work, what can you try else",
          to: `/reader`,
          hash: '#didnt-work',
        },
      ],
    },
    {
      id: 'thanks',
      name: 'Thanks',
      to: `/reader`,
      hash: '#thanks',
    },
    {
      id: 'about',
      name: 'About',
      to: `/reader`,
      hash: '#about',
    },
  ]

  return (
    <ThreeSectionsLayout
      content={
        <div
          className="absolute inset-0 z-10 grid grid-cols-2 gap-4 object-cover object-center px-8 py-24 text-black"
          style={{ backgroundImage: `url(${bookBg})` }}
        >
          <p>
            lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam,
            volupt Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda doloribus id
            incidunt iure nulla optio, perferendis quo repudiandae vero voluptatibus. Animi
            architecto non omnis rem unde. Nihil quidem ratione sequi.
          </p>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam,
            lipsum dolor sit amet, consectetur adipisicing elit. Assumenda doloribus id incidunt
            iure
          </p>
        </div>
      }
      sidebarTop={<div className="px-4 pt-4 text-xl font-semibold">Contents</div>}
      sidebar={
        <div className="px-2">
          <BookContentsList className="pt-6" items={contents} />
        </div>
      }
    />
  )
}
