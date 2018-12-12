const express = require('express');
const router = express.Router();

const Books = require('../models').Books;
const Loans = require('../models').Loans;
const Patrons = require('../models').Patrons;

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Create association
Books.hasMany(Loans, { foreignKey: 'book_id' });


const query = {
    attributes: [ "id", "title", "author", "genre", "first_published"]
};

const overdueLoans = {
    attributes: [ "book_id" ],
    where: {
        [Op.and]: {
            return_by: {
                [Op.lt]: new Date()
            },
            returned_on: null
        }
    }
};

const overdueBooks = {
    attributes: query.attributes,
    where: {
        id: {
        }
    }
};

const checkedLoans = {
    attributes: [ "book_id" ],
    where: {
        [Op.and]: {
            return_by: {
                [Op.ne]: null
            },
            returned_on: null
        }
    }
};

const checkedBooks = {
    attributes: query.attributes,
    where: {
        id: {
        }
    }
};

const detailsQuery = {
    attributes: query.attributes,
    include: { 
            model: Loans, attributes: ["id", "book_id", "patron_id", "loaned_on", "return_by", "returned_on"],
            include: { model: Patrons, attributes: ["first_name", "last_name"]} 
    }
};

// All Books
router.get('/', function(req, res, next) {

    // Overdue Books
    if(req.query.filter === "overdue") {
        Loans.findAll(overdueLoans)
            .then( loans => {
                const bookIds = loans.map( loan => loan.book_id);
                overdueBooks.where.id = {
                    [Op.in]: bookIds
                };
                return Books.findAll(overdueBooks);
            })
            .then( books => {
                res.render('books', { books });
            });
    } 

    // Checked out Books
    else if (req.query.filter === "checked_out") {
        Loans.findAll(checkedLoans)
            .then( loans => {
                const bookIds = loans.map( loan => loan.book_id);
                checkedBooks.where.id = {
                    [Op.in]: bookIds
                };
                return Books.findAll(checkedBooks);
            })
            .then( books => {
                res.render('books', { books });
            })
    } 

    // All Books
    else {
        Books.findAll(query).then( books => {
            res.render('books', { books });
        })
    }
});


// New Book
router.get('/new', (req, res) => {
    res.render('new-book', { book: Books.build() });
});

router.post('/', (req, res, next) => {
    Books.create(req.body).then( () => {
        res.redirect('/books');
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                title: {
                    msg: filterErrorMessage("title", errorMessages)
                },
                author: {
                    msg: filterErrorMessage("author", errorMessages)
                },
                genre: {
                    msg: filterErrorMessage("genre", errorMessages)
                },
                firstPublished: {
                    msg: filterErrorMessage("published", errorMessages)
                }
            }
            res.render("new-book", { book: Books.build(req.body), errors });
        }
        else throw err;
    }).catch( err => {
        res.sendStatus(500);
    })
})

// Book Details
let bookDetails; // this variable is assigned here and used in PUT method update below
router.get('/details/:id', (req, res) => {
    const id = req.params.id;
    Books.findByPk(id, detailsQuery).then( book => {
        bookDetails = book;
        res.render('book-details', { book });
    });
});

// Update book details
router.put('/details/:id', (req, res) => {
    Books.findByPk(req.params.id, detailsQuery).then( book => {
        if (book) {
            return book.update(req.body);
        }
        else res.sendStatus(404);
    }).then( (book) => {
        res.redirect('/books');
        return book
    }).catch( err => {
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                title: {
                    msg: filterErrorMessage("title", errorMessages)
                },
                author: {
                    msg: filterErrorMessage("author", errorMessages)
                },
                genre: {
                    msg: filterErrorMessage("genre", errorMessages)
                },
                firstPublished: {
                    msg: filterErrorMessage("published", errorMessages)
                }
            }
            res.render('book-details', { book: bookDetails, errors })
        }
    })
})

const filterErrorMessage = (type, messages) => {
    messages = messages.filter( message => {
        return message.indexOf(type) > -1;
    });

    return messages.map (message => {
        const endOfString = message[message.length - 1];
        if (endOfString === "\n") {
            return message.substr(0, message.length - 2);
        }
        return message;
    })
};
  
module.exports = router;