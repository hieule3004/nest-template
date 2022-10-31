FROM alpine

RUN apk update
RUN apk add openldap-clients

ENTRYPOINT ["ldapsearch"]