import { ModalWindow } from '../components/ModalWindow'
// import { useSettings } from '../hooks/useSettings'
// import { bookDetailsRoute } from '../routes/routes'

export const BookDetailsView: React.FC = () => {
  // const { bookId } = bookDetailsRoute.useParams()
  // const { getSetting, setSetting } = useSettings()

  return <ModalWindow></ModalWindow>
}

/*
<div>
      <h2>Book Details</h2>
      <div>Book ID: {bookId}</div>

      {getSetting('currentlyReading') === Number(bookId) && (
        <div className="text-green-600">Currently reading</div>
      )}

      <Button
        label="READ"
        onClick={() => {
          setSetting('currentlyReading', Number(bookId))
        }}
      />
    </div>
 */
