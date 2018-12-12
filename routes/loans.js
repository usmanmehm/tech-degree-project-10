const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Loans = require('../models').Loans;
const Patrons = require('../models').Patrons;
const Books = require('../models').Books;

// Create associations
Loans.belongsTo(Patrons, { foreignKey: 'patron_id' });
Loans.belongsTo(Books, { foreignKey: 'book_id' });


// <---- QUERIES ----> //
const loanOptions = {
    attributes: ["id", "book_id", "patron_id", "loaned_on", "return_by", "returned_on"],
    include: [
        { model: Patrons, attributes: ["first_name", "last_name"] },
        { model: Books, attributes: ["title"]}
    ]
}

const overdueLoans = {
    attributes: loanOptions.attributes,
    include: loanOptions.include,
    where: {
        [Op.and]: {
            return_by: {
                [Op.lt]: new Date()
            },
            returned_on: null
        }
    },
};

const checkedLoans = {
    attributes: loanOptions.attributes,
    include: loanOptions.include,
    where: {
        [Op.and]: {
            return_by: {
                [Op.ne]: null
            },
            returned_on: null
        }
    }
};

const booksAvailable = {
    attributes: ["title"],
    include: {
        model: Loans,
        where: {
            [Op.or]: {
                returned_on: {
                    [Op.ne]: null
                },
                loaned_on: null
            }
        }
    }
}

// <---- END OF QUERIES ----> //

const loanData = {
    books: null,
    patrons: null
};
const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();
const today = `${year}-${month}-${day}`;
const returnBy = `${year}-${month}-${day + 7}`;

// <---- ROUTES ----> //
// List of Loans
router.get('/', function(req, res, next) {
    // Overdue Loans
    if(req.query.filter === "overdue") {
        Loans.findAll(overdueLoans).then ( loans => {
            res.render('loans', { loans });
        })
    }
    // Checked out
    else if (req.query.filter === "checked_out") {
        Loans.findAll(checkedLoans).then( loans => {
            res.render('loans', { loans });
        })
    } 
    // All Loans
    else {
        Loans.findAll(loanOptions).then( loans => {
            res.render('loans', { loans });
        })
    }
});

// New loan
router.get('/new', function(req, res, next) {
    Books.findAll().then( books => {
        loanData.books = books;
        // return books;
    }).then( () => {
        Patrons.findAll().then( patrons => {
            loanData.patrons = patrons;
            res.render( 'new-loan', { books: loanData.books, patrons: loanData.patrons, loanedOn: today, returnBy  });
        })
    })
});

router.post('/', (req, res, next) => {
    Loans.create(req.body).then( () => {
        res.redirect('/loans');
    }).catch( err => {
        // This is the error being specified when we submit with fields being blank
        if(err.name === "SequelizeValidationError") {
            const errorMessages = err.message.split("Validation error:");

            const errors = {
                book: {
                    msg: filterErrorMessage("select a book", errorMessages)
                },
                patron: {
                    msg: filterErrorMessage("patron", errorMessages)
                },
                loanedOn: {
                    msg: filterErrorMessage("loaned", errorMessages)
                },
                returnBy: {
                    msg: filterErrorMessage("return", errorMessages)
                }
            }
            res.render("new-loan", { 
                books: loanData.books, 
                patrons: loanData.patrons, 
                loanedOn, 
                returnBy, 
                errors 
            });
        }
        else throw err;
    }).catch( err => {
        res.sendStatus(500);
    })
});

router.get('/return/:id', (req, res) => {
    Loans.findByPk(req.params.id, loanOptions).then( loan => {
        res.render('return', { loan, today })
    })
})

router.put('/return/:id', (req,res) => {
    Loans.findByPk(req.params.id).then( loan => {
        loan.update({ returned_on: new Date() });
        res.redirect('/loans');
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