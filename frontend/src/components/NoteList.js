import React, { useState, useEffect, useRef } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import Modal from 'react-bootstrap/Modal';

const NoteList = ({ notes, username, handleAddNote, accessToken }) => {
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editedNote, setEditedNote] = useState({ id: '', title: '', content: '' });
  const [deletedNote, setDeletedNote] = useState(null);
  const [formErrors, setFormErrors] = useState([]);
  const [notesList, setNotesList] = useState(notes);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedDeleteNoteId, setSelectedDeleteNoteId] = useState(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    setNotesList(notes);
  }, [notes]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewNote((prevNote) => ({ ...prevNote, [name]: value }));
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditedNote((prevNote) => ({ ...prevNote, [name]: value }));
  };

  const handleAddNoteClick = () => {
    const note = { ...newNote };
    handleAddNote(note);
    setNewNote({ title: '', content: '' });
  };

  const handleEditNote = (note) => {
    setEditedNote({ id: note._id, title: note.title, content: note.content });
    setSelectedNoteId(note._id);
    setSelectedDeleteNoteId(null);
  };

  const handleUpdateNote = () => {
    fetch(`http://localhost:3001/api/notes/${editedNote.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(editedNote),
    })
      .then((res) => res.json())
      .then((data) => {
        const updatedNotes = notesList.map((note) => (note._id === data._id ? data : note));
        setNotesList(updatedNotes);
        setEditedNote({ id: '', title: '', content: '' });
        setSelectedNoteId(null);
      })
      .catch((error) => console.log(error));
  };

  const handleDeleteNote = (note) => {
    setDeletedNote(note);
    setSelectedDeleteNoteId(note._id);
    setSelectedNoteId(null);
  };

  const handleConfirmDelete = () => {
    fetch(`http://localhost:3001/api/notes/${deletedNote._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        const updatedNotes = notesList.filter((note) => note._id !== deletedNote._id);
        setNotesList(updatedNotes);
        setDeletedNote(null);
        setSelectedDeleteNoteId(null);
      })
      .catch((error) => console.log(error));
  };

  const inputRef = useRef(null);
  const handleImport = () => {
    inputRef.current?.click();
  };

  const handleCancelEdit = () => {
    setEditedNote({ id: '', title: '', content: '' });
    setSelectedNoteId(null);
  };

  const handleJsonExport = () => {
    const currentUserNotes = notes.filter((note) => note.username === username);
    const jsonData = JSON.stringify(currentUserNotes);

    const element = document.createElement('a');
    const file = new Blob([jsonData], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'notes.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleXmlExport = () => {
    const currentUserNotes = notes.filter((note) => note.username === username);

    const xmlContent = generateXml(currentUserNotes);
    const element = document.createElement('a');
    const file = new Blob([xmlContent], { type: 'application/xml' });
    element.href = URL.createObjectURL(file);
    element.download = 'notes.xml';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateXml = (notes) => {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<notes>\n';
    for (let i = 0; i < notes.length; i++) {
      xmlContent += `  <note>\n    <title>${notes[i].title}</title>\n    <content>${notes[i].content}</content>\n  </note>\n`;
    }
    xmlContent += '</notes>';

    return xmlContent;
  };

  const handleAddNoteFromJson = () => {
    fetch(`http://api.weatherapi.com/v1/current.json?key=f2f18035d8134cad94d160445232106&q=${cityName}`)
      .then((response) => response.json())
      .then((data) => {
        const { location, current } = data;
        const note = {
          title: location.name,
          content: `Temperatura: ${current.temp_c}°C\nTemperatura odczuwalna: ${current.feelslike_c}°C\n Wiatr: ${current.wind_kph} km/h`,
        };
        handleAddNote(note);
        setShowWeatherModal(false);
      })
      .catch((error) => console.log(error));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      try {
        const parsedNotes = JSON.parse(fileContent);
        if (Array.isArray(parsedNotes)) {
          parsedNotes.forEach((note) => {
            const { title, content } = note;
            const newNote = {
              title,
              content,
              username: username,
            };
            handleAddNote(newNote);
          });
        } else {
          const { title, content } = parsedNotes;
          const newNote = {
            title,
            content,
            username: username,
          };
          handleAddNote(newNote);
        }
      } catch (error) {
        console.log('Błąd podczas parsowania pliku JSON', error);
      }
    };
    reader.readAsText(file);
  };


  return (
    <>
      <div className="mt-3 form-border mx-auto w-50">
        <Form>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Tytuł notatki:</Form.Label>
            <Form.Control
              placeholder="Tytuł"
              aria-label="Tytuł notatki: "
              type="text"
              name="title"
              value={newNote.title}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>Treść notatki:</Form.Label>
            <Form.Control
              placeholder="Treść"
              as="textarea"
              rows={3}
              name="content"
              value={newNote.content}
              onChange={handleInputChange}
            />
          </Form.Group>
          <div className="d-flex justify-content-left">
            <Button onClick={handleAddNoteClick} className="me-2" variant="primary">
              Dodaj notatkę
            </Button>
            <Button onClick={() => setShowWeatherModal(true)} className="me-2" variant="primary">
              Dodaj notatkę pogodową
            </Button>
            <Button onClick={handleImport} className="me-2" variant="primary">
              <input ref={inputRef} className="d-none" type="file" onChange={handleFileChange} />
              Importuj notatki
            </Button>
            <Button onClick={handleJsonExport} className="me-2" variant="primary">
              Eksportuj notatki (JSON)
            </Button>
            <Button onClick={handleXmlExport} className="me-2" variant="primary">
              Eksportuj notatki (xml)
            </Button>
          </div>
        </Form>
      </div>
      <div className="mt-3 mx-auto" style={{ width: '60%' }}>
        <Accordion defaultActiveKey="0" className="d-inline-block w-100">
          {notesList.map((note, index) => {
            if (note.username === username) {
              return (
                <Accordion.Item eventKey={index.toString()} key={note._id}>
                  <Accordion.Header>{note.title}</Accordion.Header>
                  <Accordion.Body>
                    <p>{note.content}</p>
                    <Button onClick={() => handleEditNote(note)} className="me-2" variant="success">
                      Edytuj
                    </Button>
                    <Button onClick={() => handleDeleteNote(note)} className="me-2" variant="danger">
                      Usuń
                    </Button>
                    {selectedNoteId === note._id && (
                      <>
                        <div className="mt-3 form-border mx-auto w-50">
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Tytuł notatki:</Form.Label>
                              <Form.Control
                                placeholder="Tytuł"
                                aria-label="Tytuł notatki: "
                                type="text"
                                name="title"
                                value={editedNote.title}
                                onChange={handleEditInputChange}
                              />
                            </Form.Group>
                          </Form>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Treść notatki:</Form.Label>
                              <Form.Control
                                placeholder="Treść"
                                as="textarea"
                                rows={3}
                                name="content"
                                value={editedNote.content}
                                onChange={handleEditInputChange}
                              />
                            </Form.Group>
                          </Form>
                        </div>
                        <div className="d-flex justify-content-center">
                          <Button onClick={handleUpdateNote} className="me-2" variant="success">
                            Zapisz zmiany
                          </Button>
                          <Button onClick={handleCancelEdit} className="me-2" variant="secondary">
                            Anuluj
                          </Button>
                        </div>
                      </>
                    )}
                    {selectedDeleteNoteId === note._id && (
                      <div className="mt-3">
                        <p>Czy na pewno chcesz usunąć tę notatkę?</p>
                        <Button onClick={handleConfirmDelete} className="me-2" variant="danger">
                          Potwierdź
                        </Button>
                        <Button onClick={() => setSelectedDeleteNoteId(null)} className="me-2" variant="secondary">
                          Anuluj
                        </Button>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              );
            } else {
              return null;
            }
          })}
        </Accordion>
      </div>
      <Modal show={showWeatherModal} onHide={() => setShowWeatherModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Dodaj notatkę pogodową</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nazwa miasta:</Form.Label>
            <Form.Control
              type="text"
              name="cityName"
              value={cityName}
              onChange={(event) => setCityName(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAddNoteFromJson} variant="primary">
            Dodaj
          </Button>
          <Button onClick={() => setShowWeatherModal(false)} variant="secondary">
            Anuluj
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NoteList;
